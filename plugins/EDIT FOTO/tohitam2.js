const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('@config');

// Fungsi upload ke tmp-files
async function uploadToTmpFiles(filePath) {
    try {
        const form = new FormData();
        form.append('expired', '6months');
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.put(
            "https://autoresbot.com/tmp-files/upload",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Referer': 'https://autoresbot.com/',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Edg/126.0.0.0'
                }
            }
        );
        return response.data.fileUrl;
    } catch (error) {
        console.error("Upload to tmp-files failed:", error);
        throw new Error('Upload ke tmp-files gagal.');
    }
}

// Handler utama
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;
    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim/balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🕒", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        // Upload ke tmp-files
        const tmpUrl = await uploadToTmpFiles(mediaPath);

        // Panggil API JadiHitam
        const apiUrl = `https://api.betabotz.eu.org/api/maker/jadihitam?apikey=${config.apikey.key}&url=${encodeURIComponent(tmpUrl)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const resultPath = path.join('tmp', `hitam_${Date.now()}.jpg`);
        fs.writeFileSync(resultPath, response.data);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ gambar berhasil diubah ke mode hitam, maaf kalau hasilnya jelek!_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(remoteJid, { text: "⚠️ maaf, terjadi kesalahan saat memproses gambar." }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tohitam2"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};