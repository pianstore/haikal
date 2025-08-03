const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('@config');

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
        throw new Error('Upload ke Catbox gagal.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command, fullText } = messageInfo;
    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        const queryText = fullText.replace(prefix + command, '').trim();

        if (mediaType !== 'video' || !queryText) {
            return await reply(m, `⚠️ _Balas video dan beri pertanyaan, contoh:_\n*${prefix + command} deskripsikan isi video ini*`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🎥", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File video tidak ditemukan setelah diunduh.');
        }

        // Upload ke Catbox
        const videoUrl = await uploadToCatbox(mediaPath);

        // Panggil API Bard Video
        const bardUrl = `https://api.betabotz.eu.org/api/search/bard-video?apikey=${config.apikey.key}&url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(queryText)}`;
        const response = await axios.get(bardUrl);

        if (response.data && response.data.result) {
            await sock.sendMessage(remoteJid, {
                text: `📽️ _Deskripsi video:_\n\n${response.data.result}`,
            }, { quoted: message });
        } else {
            throw new Error('Respons API tidak valid');
        }

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("Error in bardvideo plugin:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Maaf, terjadi kesalahan saat memproses video dan teks pencarian.",
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["bardvideo","bardvid"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};