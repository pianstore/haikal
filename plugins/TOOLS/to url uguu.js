const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const response = await axios.post('https://uguu.se/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data && response.data.files && response.data.files.length > 0) {
            return response.data.files[0].url;
        }

        throw new Error('Respons dari Uguu tidak sesuai format.');
    } catch (error) {
        console.error('Upload ke Uguu gagal:', error.response ? error.response.data : error.message);
        throw new Error('Gagal upload ke Uguu.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker', 'video', 'audio', 'document'].includes(mediaType)) {
            return await reply(m, `⚠️ _Kirim atau balas media dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const result = await uploadToUguu(mediaPath);

        await reply(m, `_✅ upload sukses_
📎 *link*: ${result}`);

        fs.unlinkSync(mediaPath); // Hapus file setelah upload
    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Gagal mengunggah ke Uguu. Silakan coba lagi nanti!"
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["uguu"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};