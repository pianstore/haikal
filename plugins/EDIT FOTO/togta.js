const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require("form-data");
const mess = require('@mess');
const config = require("@config");

// Upload ke Uguu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const response = await axios.post('https://uguu.se/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data?.files?.[0]?.url) {
            return response.data.files[0].url;
        }

        throw new Error('Format respons dari Uguu tidak sesuai.');
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
            headers: {
                ...form.getHeaders()
            }
        });

        return response.data;
    } catch (error) {
        console.error('❌ Upload ke Catbox gagal:', error.response?.data || error.message);
        return null;
    }
}

// Handler utama
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, type, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim/balas gambar atau stiker dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('❌ Gagal mengunduh file media.');

        // Upload ke Uguu → fallback ke Catbox
        let uploadedUrl = await uploadToUguu(mediaPath);
        if (!uploadedUrl) uploadedUrl = await uploadToCatbox(mediaPath);
        if (!uploadedUrl) throw new Error("❌ Upload gagal ke Uguu maupun Catbox.");

        const apiUrl = `${config.apikey.botz}/api/maker/jadigta?url=${encodeURIComponent(uploadedUrl)}&apikey=${config.apikey.key}`;
        const api = await axios.get(apiUrl);

        const resultImage = api?.data?.result;
        if (!resultImage) throw new Error("❌ Gagal mendapatkan hasil dari API jadigta.");

        await sock.sendMessage(remoteJid, {
            image: { url: resultImage },
            caption: mess.general.success
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("TOGTA ERROR:", error);
        await reply(m, `_❌ terjadi kesalahan saat memproses gambar jadi GTA._\n\nERROR: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['togta'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};