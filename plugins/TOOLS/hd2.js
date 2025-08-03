const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mess = require('@mess');

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
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });
        return typeof response.data === 'string' ? response.data : null;
    } catch (err) {
        console.error('❌ Upload ke Catbox gagal:', err.message);
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

        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('File media tidak ditemukan.');

        // Upload ke Uguu → fallback ke Catbox
        let srcUrl = await uploadToUguu(mediaPath);
        if (!srcUrl) srcUrl = await uploadToCatbox(mediaPath);
        if (!srcUrl) throw new Error('❌ Gagal upload ke Uguu maupun Catbox.');

        const { data } = await axios.get(`https://api.vreden.my.id/api/artificial/hdr?url=${encodeURIComponent(srcUrl)}&pixel=4`);
        const resultUrl = data?.result?.data?.downloadUrls?.[0];

        if (!resultUrl) throw new Error('Gagal mendapatkan hasil dari API:\n' + JSON.stringify(data));

        const { data: buffer } = await axios.get(resultUrl, { responseType: 'arraybuffer' });

        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success },
            { quoted: message }
        );

        fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error("ReminiVreden error:", err);
        await reply(m, `maaf, *hd2* error. silahkan cobala pakai *hd3* sebagai alternatif.`);
    }
}

module.exports = {
    handle,
    Commands: ['hd2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};