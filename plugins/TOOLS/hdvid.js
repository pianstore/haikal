const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mess = require('@mess');

// Fungsi upload ke Catbox
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

        return response.data; // URL hasil upload
    } catch (error) {
        throw new Error('Upload ke Catbox gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'video') {
            return await reply(m, `⚠️ _Kirim/Balas video dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('Video tidak ditemukan setelah diunduh.');
        }

        // Upload ke Catbox
        const uploadedUrl = await uploadToCatbox(mediaPath);
        const encodedVideoUrl = encodeURIComponent(uploadedUrl);

        // Request ke endpoint Remini Video
        const endpoint = `https://api.alyachan.dev/api/remini-video?video=${encodedVideoUrl}&apikey=brziko`;
        const { data } = await axios.get(endpoint);

        if (!data?.status || !data?.data?.url) {
            throw new Error('Gagal mendapatkan video hasil dari API.');
        }

        // Kirim hasil video yang sudah diproses
        await sock.sendMessage(remoteJid, {
            video: { url: data.data.url },
            caption: mess.general.success
        }, { quoted: message });

        fs.unlinkSync(mediaPath); // hapus video setelah dipakai

    } catch (error) {
        const errMsg = `_❌ Gagal memproses video._\n\n📄 ERROR: Terjadi kesalahan internal.`;
        await reply(message, errMsg);
    }
}

module.exports = {
    handle,
    Commands: ["hdvid"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};