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
            headers: form.getHeaders()
        });

        return response.data?.files?.[0]?.url || null;
    } catch (err) {
        console.error('❌ Upload ke Uguu gagal:', err.response?.data || err.message);
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
            headers: form.getHeaders()
        });

        return response.data;
    } catch (err) {
        console.error('❌ Upload ke Catbox gagal:', err.response?.data || err.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim/balas gambar atau stiker dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: '⏳', key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) throw new Error('❌ File media tidak ditemukan.');

        // Upload: Uguu → fallback Catbox
        let fileUrl = await uploadToUguu(mediaPath);
        if (!fileUrl) fileUrl = await uploadToCatbox(mediaPath);
        if (!fileUrl) throw new Error('Gagal upload ke Uguu maupun Catbox.');

        // Call API Anabot toOil_painting
        const apiUrl = `https://anabot.my.id/api/ai/toOil_painting?imageUrl=${encodeURIComponent(fileUrl)}&apikey=freeApikey`;
        const res = await axios.get(apiUrl);
        const resultUrl = res.data?.data?.result;

        if (!resultUrl) throw new Error('❌ Tidak ada hasil dari API.');

        const resultBuffer = (await axios.get(resultUrl, { responseType: 'arraybuffer' })).data;
        const resultPath = path.join('tmp', `oilpainting_${Date.now()}.jpg`);
        fs.writeFileSync(resultPath, resultBuffer);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ berhasil diubah ke gaya lukisan minyak_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error("❌ Error plugin tooilpainting:", error);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ maaf, terjadi kesalahan:\n${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tooilpainting"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};