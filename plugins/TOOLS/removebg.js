const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        });

        return response.data; // langsung URL
    } catch (error) {
        console.error('Upload failed:', error.response ? error.response.data : error.message);
        throw new Error('Upload ke Catbox gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _kirim/balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('File media tidak ditemukan.');

        const imageUrl = await uploadToCatbox(mediaPath);

        // Gunakan endpoint baru dari flowfalcon.dpdns.org
        const endpoint = `https://elrayyxml.vercel.app/image/removebg?url=${encodeURIComponent(imageUrl)}`;
        const buffer = await axios.get(endpoint, { responseType: 'arraybuffer' }).then(res => res.data);

        await sock.sendMessage(remoteJid, {
            image: buffer,
            caption: '✅ background berhasil dihapus!',
        }, { quoted: message });

        fs.unlinkSync(mediaPath); // hapus file temp
    } catch (error) {
        console.error("Error:", error.message);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ maaf, terjadi kesalahan. coba lagi nanti!",
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["rmbg", "removebg", "nobg"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};