const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mess = require('@mess');
const config = require('@config');

// Upload ke Uguu terlebih dahulu
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

        throw new Error('Format respons Uguu tidak sesuai.');
    } catch (error) {
        console.error('❌ Upload ke Uguu gagal:', error.response ? error.response.data : error.message);
        return null;
    }
}

// Fallback ke Catbox jika Uguu gagal
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
        console.error('❌ Upload ke Catbox gagal:', error.response ? error.response.data : error.message);
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

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('❌ Gagal mengunduh media.');

        // Upload ke Uguu → fallback ke Catbox
        let uploadedUrl = await uploadToUguu(mediaPath);
        if (!uploadedUrl) uploadedUrl = await uploadToCatbox(mediaPath);
        if (!uploadedUrl) throw new Error("❌ Gagal upload ke Uguu maupun Catbox.");

        // Panggil API jadianime
        const api = await axios.get(`${config.apikey.botz}/api/maker/jadianime?url=${encodeURIComponent(uploadedUrl)}&apikey=${config.apikey.key}`);
        const resultImage = api?.data?.result?.img_1 || api?.data?.result?.img_2;

        if (!resultImage) throw new Error("❌ Gagal mendapatkan gambar anime.");

        await sock.sendMessage(remoteJid, {
            image: { url: resultImage },
            caption: mess.general.success
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("TOANIME ERROR:", error);
        await reply(m, `_terjadi kesalahan saat memproses gambar/stiker._\n\nERROR : ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['toanime'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};