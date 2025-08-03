const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

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
        console.error('Upload failed:', error.response ? error.response.data : error.message);
        throw new Error('Upload ke Catbox gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _Kirim atau balas gambar/stiker dengan caption *${prefix + command}*_`);
        }

        const fromLang = 'en';  // asal bahasa
        const toLang = 'id';    // target bahasa

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('File tidak ditemukan.');

        const uploadedUrl = await uploadToCatbox(mediaPath);

        const endpoint = `https://api.alyachan.dev/api/image-translator?img=${encodeURIComponent(uploadedUrl)}&from=${fromLang}&to=${toLang}&apikey=brziko`;

        const { data } = await axios.get(endpoint);
        if (!data.status) throw new Error('API gagal memproses gambar.');

        const translatedImage = data.data.url;
        const translatedTexts = data.data.text.join('\n• ');

        await sock.sendMessage(remoteJid, {
            image: { url: translatedImage },
            caption: `✅ *Gambar Terjemahan*\n\n📄 *Teks Dikenali:*\n• ${translatedTexts}`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error("imgtranslat error:", err);
        await sock.sendMessage(remoteJid, { text: "⚠️ Gagal memproses gambar. Coba lagi nanti." }, { quoted: messageInfo.message });
    }
}

module.exports = {
    handle,
    Commands: ["imgtranslat"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};