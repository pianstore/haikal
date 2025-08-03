const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mess = require('@mess');
const config = require('@config');

// Upload ke Uguu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const response = await axios.post('https://uguu.se/upload', form, {
            headers: { ...form.getHeaders() }
        });

        if (response.data?.files?.[0]?.url) {
            return response.data.files[0].url;
        }

        throw new Error('Format respons Uguu tidak sesuai.');
    } catch (error) {
        console.error('❌ Upload ke Uguu gagal:', error.response?.data || error.message);
        return null;
    }
}

// Fallback ke Catbox
async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        });

        return typeof response.data === 'string' ? response.data : null;
    } catch (error) {
        console.error('❌ Upload ke Catbox gagal:', error.response?.data || error.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, type, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _kirim/balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error("❌ File tidak ditemukan setelah diunduh.");

        // Coba upload ke Uguu lalu fallback ke Catbox
        let imageUrl = await uploadToUguu(mediaPath);
        if (!imageUrl) imageUrl = await uploadToCatbox(mediaPath);
        if (!imageUrl) throw new Error("❌ Gagal upload ke Uguu maupun Catbox.");

        // Kirim ke API Remini
        const reminiUrl = `${config.apikey.botz}/api/tools/remini?url=${encodeURIComponent(imageUrl)}&apikey=${config.apikey.key}`;
        const response = await axios.get(reminiUrl);
        const json = response.data;

        if (!json?.url) throw new Error("❌ API tidak mengembalikan URL hasil.");

        await sock.sendMessage(remoteJid, {
            image: { url: json.url },
            caption: mess.general.success,
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error("Remini error:", err);
        await reply(m, `maaf, *hd* error. coba gunakan *hd2* sebagai alternatif.`);
    }
}

module.exports = {
    handle,
    Commands: ['hd', 'remini'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};