const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const config = require('@config');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const APIKEY = config.apikey.key;
const BASE_URL = config.apikey.botz;

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
        console.error('Upload gagal:', error.response ? error.response.data : error.message);
        throw new Error('Gagal mengupload ke Catbox.');
    }
}

async function detectMusicFromURL(catboxUrl) {
    try {
        const endpoint = `${BASE_URL}/api/tools/whatmusic?apikey=${APIKEY}&url=${catboxUrl}`;
        const { data } = await axios.get(endpoint);
        return data;
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        throw new Error('Gagal mendeteksi musik dari API.');
    }
}

function parseResultString(rawResult) {
    const lines = rawResult.split('\n').filter(line => line.trim() !== '');
    const result = {};
    lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        result[key.trim()] = rest.join(':').trim();
    });
    return result;
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

        if (!apiResponse.status || !apiResponse.result) {
            throw new Error('Musik tidak terdeteksi.');
        }

        const parsed = parseResultString(apiResponse.result);

        const caption = `_🎵 Musik Terdeteksi:_
📌 *Judul:* ${parsed['Title'] || '-'}
👤 *Artis:* ${parsed['Artists'] || '-'}
🕒 *Durasi:* ${parsed['Duration'] || '-'}
📆 *Rilis:* ${parsed['Release'] || '-'}
🎧 *Genre:* ${parsed['Genre'] || '-'}
💯 *Score:* ${parsed['Score'] || '-'}
📂 *Sumber:* ${parsed['Source'] || '-'}
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
    Commands: ["whatmusic"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};