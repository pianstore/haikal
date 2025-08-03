const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");

// Upload ke Uguu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const res = await axios.post('https://uguu.se/upload', form, {
            headers: form.getHeaders()
        });

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

        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        return res.data;
    } catch (err) {
        console.error('❌ Upload ke Catbox gagal:', err.message);
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

        await sock.sendMessage(remoteJid, { react: { text: "🕒", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('❌ File media tidak ditemukan.');

        // Upload ke Uguu, fallback ke Catbox
        let fileUrl = await uploadToUguu(mediaPath);
        if (!fileUrl) fileUrl = await uploadToCatbox(mediaPath);
        if (!fileUrl) throw new Error("❌ Upload gagal ke semua layanan.");

        // Panggil API
        const apiUrl = `https://api.alyachan.dev/api/ai-anime-toreal?image=${encodeURIComponent(fileUrl)}&apikey=brziko`;
        const response = await axios.get(apiUrl);
        const imageUrl = response.data?.data?.url;
        if (!imageUrl) throw new Error('URL hasil tidak ditemukan dalam respons API.');

        const resultImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const resultPath = path.join('tmp', `real_${Date.now()}.webp`);
        fs.writeFileSync(resultPath, resultImage.data);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ berhasil diubah menjadi versi realistik!_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error("❌ Error plugin toreal:", error.message);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Maaf, terjadi kesalahan saat memproses gambar."
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["toreal"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};