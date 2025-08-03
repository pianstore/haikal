const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const config = require('@config');

// Upload ke Uguu terlebih dahulu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const response = await axios.post('https://uguu.se/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data?.files?.[0]?.url) {
            return response.data.files[0].url;
        }

        throw new Error('Format respons Uguu tidak sesuai.');
    } catch (error) {
        console.error('❌ Upload ke Uguu gagal:', error.response ? error.response.data : error.message);
        return null;
    }
}

// Fallback ke Catbox jika Uguu gagal
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
        console.error('❌ Upload ke Catbox gagal:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command, fullText } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        const queryText = fullText.replace(prefix + command, '').trim();

        if (!['image', 'sticker'].includes(mediaType) || !queryText) {
            return await reply(m, `⚠️ _balas gambar dan beri pertanyaan, contoh:_\n*${prefix + command} tolong kerjakan*`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🤖", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) throw new Error('❌ File tidak ditemukan setelah diunduh.');

        // Coba upload ke Uguu dulu
        let imageUrl = await uploadToUguu(mediaPath);
        if (!imageUrl) imageUrl = await uploadToCatbox(mediaPath);
        if (!imageUrl) throw new Error('❌ Gagal upload ke Uguu maupun Catbox.');

        // Kirim ke API Bard Image
        const bardUrl = `https://api.betabotz.eu.org/api/search/bard-img?apikey=${config.apikey.key}&url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(queryText)}`;
        const response = await axios.get(bardUrl);

        if (response.data?.result) {
            await sock.sendMessage(remoteJid, {
                text: `💬 _Hasil berdasarkan gambar:_\n\n${response.data.result}`
            }, { quoted: message });
        } else {
            throw new Error('❌ Respons API tidak valid.');
        }

        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("Error in bardimg plugin:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ maaf, terjadi kesalahan saat memproses gambar dan teks."
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["bardimg"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};