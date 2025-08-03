const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('@config');

async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        return response.data;
    } catch (error) {
        console.error('Upload failed:', error.response ? error.response.data : error.message);
        throw new Error('Upload ke Catbox gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;
    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🕒", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        // Upload ke Catbox
        const catboxUrl = await uploadToCatbox(mediaPath);

        // Panggil API JadiHitam
        const apiUrl = `https://api.betabotz.eu.org/api/maker/jadiputih?apikey=${config.apikey.key}&url=${encodeURIComponent(catboxUrl)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const resultPath = path.join('tmp', `putih_${Date.now()}.jpg`);
        fs.writeFileSync(resultPath, response.data);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ Gambar berhasil diubah ke mode putih maaf kalo hasil nya jelek!_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(remoteJid, { text: "⚠️ Maaf, terjadi kesalahan saat memproses gambar." }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["toputih"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};