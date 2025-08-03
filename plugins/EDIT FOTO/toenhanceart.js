const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('@config');

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
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;
    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim/balas gambar atau stiker dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: '🕒', key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) throw new Error('❌ File media tidak ditemukan setelah diunduh.');

        // Upload ke Uguu → fallback ke Catbox
        let uploadedUrl = await uploadToUguu(mediaPath);
        if (!uploadedUrl) uploadedUrl = await uploadToCatbox(mediaPath);
        if (!uploadedUrl) throw new Error('❌ Gagal upload ke Uguu maupun Catbox.');

        // Panggil API toEnhanceArtImage
        const apiUrl = `https://anabot.my.id/api/ai/toEnhanceArtImage?imageUrl=${encodeURIComponent(uploadedUrl)}&apikey=freeApikey`;
        const response = await axios.get(apiUrl);
        const resultUrl = response.data?.data?.result;

        if (!resultUrl) throw new Error('❌ Gagal mendapatkan URL hasil dari API');

        const imageBuffer = (await axios.get(resultUrl, { responseType: 'arraybuffer' })).data;
        const resultPath = path.join('tmp', `enhanceart_${Date.now()}.png`);
        fs.writeFileSync(resultPath, imageBuffer);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ gambar berhasil diperindah secara artistik!_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error('❌ ERROR plugin toenhanceart:', error);
        await sock.sendMessage(remoteJid, {
            text: '⚠️ maaf, terjadi kesalahan saat memproses gambar.'
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['toenhanceart'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};