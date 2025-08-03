const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadToAutoresbot(filePath) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('expired', '6months'); // Opsional

        const response = await axios.post(
            'https://autoresbot.com/tmp-files/upload',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Referer': 'https://autoresbot.com/',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)'
                }
            }
        );

        if (response.data?.data?.url) {
            return response.data.data.url;
        } else {
            throw new Error(`Gagal mendapatkan URL: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.error("Upload ke autoresbot gagal:", error.response?.data || error.message);
        throw new Error('Upload ke autoresbot gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;
    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker', 'video', 'audio', 'document'].includes(mediaType)) {
            return await reply(m, `⚠️ _Kirim/Balas media dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const result = await uploadToAutoresbot(mediaPath);

        await reply(m, `_✅ upload sukses_
📎 *link*: ${result}`);

        fs.unlinkSync(mediaPath); // Hapus file setelah upload
    } catch (error) {
        console.error("Error di fungsi handle:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ maaf, terjadi kesalahan saat mengunggah. coba lagi nanti!",
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["resbot"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};