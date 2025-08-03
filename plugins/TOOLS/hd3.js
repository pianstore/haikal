const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const mess = require('@mess');
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        return response.data;
    } catch (error) {
        console.error('❌ Upload ke Catbox gagal:', error.response?.data || error.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, type, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _Kirim/balas gambar atau stiker dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const fileUrl = await uploadToCatbox(mediaPath);
        if (!fileUrl || !fileUrl.startsWith('https://')) {
            throw new Error("Upload ke Catbox gagal.");
        }

        const api = new ApiAutoresbot(config.APIKEY);
        const MediaBuffer = await api.getBuffer('/api/tools/remini', { url: fileUrl });

        if (!Buffer.isBuffer(MediaBuffer)) {
            throw new Error('Respons tidak valid: bukan buffer.');
        }

        await sock.sendMessage(remoteJid, {
            image: MediaBuffer,
            caption: mess.general.success
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error('HDRESBOT ERROR:', error);
        const errorMessage = `_Terjadi kesalahan saat memproses gambar._ \n\nERROR : ${error.message}`;
        await reply(m, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['hd3'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};