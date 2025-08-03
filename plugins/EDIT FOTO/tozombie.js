const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');
const mess = require('@mess');
const config = require("@config");

// Upload ke Uguu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));
        const res = await axios.post('https://uguu.se/upload', form, { headers: form.getHeaders() });
        return res.data?.files?.[0]?.url || null;
    } catch (err) {
        console.error('❌ Upload ke Uguu gagal:', err.message);
        return null;
    }
}

// Fallback ke Catbox
async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));
        const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
        return res.data || null;
    } catch (err) {
        console.error('❌ Upload ke Catbox gagal:', err.message);
        return null;
    }
}

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
        if (!fs.existsSync(mediaPath)) throw new Error('Gagal mengunduh media.');

        let fileUrl = await uploadToUguu(mediaPath);
        if (!fileUrl) fileUrl = await uploadToCatbox(mediaPath);
        if (!fileUrl) throw new Error("Upload gagal ke semua layanan.");

        const apiUrl = `${config.apikey.botz}/api/maker/jadizombie?url=${encodeURIComponent(fileUrl)}&apikey=${config.apikey.key}`;
        const api = await axios.get(apiUrl);

        const resultImage = api?.data?.result;
        if (!resultImage) throw new Error("Gagal mendapatkan hasil dari API jadizombie.");

        await sock.sendMessage(remoteJid, {
            image: { url: resultImage },
            caption: mess.general.success
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("TOZOMBIE ERROR:", error);
        await reply(m, `_terjadi kesalahan saat memproses gambar jadi zombie._\n\nERROR : ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['tozombie'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};