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

        return response.data;
    } catch (error) {
        console.error('Upload gagal:', error.response ? error.response.data : error.message);
        throw new Error('Gagal mengupload ke Catbox.');
    }
}

async function detectMusicFromURL(catboxUrl) {
    try {
        const endpoint = `https://linecloud.my.id/api/tools/whatmusic?url=${encodeURIComponent(catboxUrl)}`;
        const { data } = await axios.get(endpoint);
        return data;
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        throw new Error('Gagal mendeteksi musik dari API.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['audio', 'video'].includes(mediaType)) {
            return await reply(m, `⚠️ _Balas audio/video dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const catboxURL = await uploadToCatbox(mediaPath);
        const apiResponse = await detectMusicFromURL(catboxURL);

        if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
            throw new Error('Musik tidak terdeteksi.');
        }

        const result = apiResponse[0];
        const durationSec = Math.floor(result.duration / 1000);
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const caption = `_🎵 Musik Terdeteksi:_
📌 *Judul:* ${result.title || '-'}
👤 *Artis:* ${result.artist || '-'}
🕒 *Durasi:* ${formattedDuration}
📆 *Rilis:* ${result.release || '-'}
💯 *Score:* ${result.score || '-'}
🔗 *URL:*
${(result.url && result.url.length > 0) ? result.url.join('\n') : '-'}
`;

        await reply(m, caption.trim());

        fs.unlinkSync(mediaPath); // Hapus file setelah selesai
    } catch (err) {
        console.error("Whatmusic Error:", err);
        await sock.sendMessage(remoteJid, { text: "⚠️ Maaf, gagal mendeteksi musik. Coba lagi." }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["whatmusic2"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};