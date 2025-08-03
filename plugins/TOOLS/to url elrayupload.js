const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Fungsi upload ke ElrayyXml (sudah diperbaiki)
async function uploadToElrayyyXml(filePath) {
    try {
        const form = new FormData();
        form.append('myFile', fs.createReadStream(filePath)); // sesuai pola nama file

        const response = await axios.post('https://elrayyxml-tmp-file.hf.space/upload', form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity
        });

        const data = response.data;

        // Log untuk debugging
        console.log("🔍 Respons server ElrayyXml:", data);

        // Jika response adalah string dan berisi /uploads/
        if (typeof data === 'string') {
            const urlMatch = data.match(/https?:\/\/[^\s]+\/uploads\/[^\s"'<>]+/);
            if (urlMatch) return urlMatch[0];
        }

        // Jika response JSON dengan key `fileUrl`
        if (typeof data === 'object' && data.fileUrl) return data.fileUrl;

        throw new Error("Respons tidak mengandung URL.");
    } catch (err) {
        console.error('❌ Gagal upload:', err.response?.data || err.message);
        throw new Error('Upload ke ElrayyXml gagal.');
    }
}

// Handler WhatsApp command
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'video', 'audio', 'document', 'sticker'].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim atau balas media dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: '⏳', key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) throw new Error('File tidak ditemukan setelah diunduh.');

        const result = await uploadToElrayyyXml(mediaPath);

        await reply(m, `_✅ upload berhasil_
📎 *link:* ${result}`);

        fs.unlinkSync(mediaPath); // hapus file temp
    } catch (err) {
        console.error('❌ Upload error:', err);
        await sock.sendMessage(remoteJid, {
            text: '⚠️ gagal mengunggah ke elrayyXml. coba lagi nanti.',
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['elray'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};