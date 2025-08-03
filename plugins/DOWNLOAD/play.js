const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');
const CryptoJS = require('crypto-js');

function generateToken() {
    const payload = JSON.stringify({ timestamp: Date.now() });
    const key = 'dyhQjAtqAyTIf3PdsKcJ6nMX1suz8ksZ';
    return CryptoJS.AES.encrypt(payload, key).toString();
}

function getVideoId(url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const query = content?.trim();
        if (!query) {
            return sendMessageWithQuote(sock, remoteJid, message,
                `_⚠️ format penggunaan:_\n\n💬 contoh:\n- *${prefix + command} the night we meet*`
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        let youtubeUrl = extractLink(query);
        let videoData = null;

        if (!youtubeUrl) {
            const result = await yts(query);
            if (!result?.videos?.length) {
                return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan dari judul yang diberikan._');
            }
            videoData = result.videos[0];
            youtubeUrl = videoData.url;
        }

        // Ambil video ID dari URL
        const idMatch = youtubeUrl.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
        const videoId = idMatch ? idMatch[1] : null;
        if (!videoId) {
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _gagal membaca ID video._');
        }

        // Tambahkan batas durasi maksimum (10 menit)
        if (videoData && videoData.seconds > 600) {
            return sendMessageWithQuote(sock, remoteJid, message,
                `⏱️ _durasi video terlalu panjang_\n\n❌ maksimum: *10 menit*\n📹 durasi video: *${Math.floor(videoData.seconds / 60)} menit*`);
        }

        const tmpPath = path.join(process.cwd(), 'abc');
        const cachedPath = path.join(tmpPath, `yt-audio-${videoId}.mp3`);

        if (!fs.existsSync(cachedPath)) {
            const response = await axios.post('https://ds1.ezsrv.net/api/convert', {
                url: youtubeUrl,
                quality: 128,
                trim: false,
                startT: 0,
                endT: 0,
                token: generateToken()
            }, {
                headers: { 'content-type': 'application/json' },
                timeout: 30000
            });

            const json = response.data;

            if (!json?.url) {
                await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
                return sendMessageWithQuote(sock, remoteJid, message, '⛔ _gagal mengambil audio. coba link lain atau ulangi beberapa saat lagi._');
            }

            const audioRes = await axios.get(json.url, { responseType: 'stream' });
            const writer = fs.createWriteStream(cachedPath);
            audioRes.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            videoData = videoData || { title: json.title, thumbnail: json.thumbnail };
        }

        const title = videoData?.title || 'Audio YouTube';
        const thumbnail = videoData?.thumbnail || "https://telegra.ph/file/9d8373b6d6614b39c2c43.jpg";

        await sock.sendMessage(remoteJid, {
            audio: { url: cachedPath },
            fileName: `${title}.mp3`,
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title,
                    body: "ʜᴀɪᴋᴀʟ",
                    thumbnailUrl: thumbnail,
                    sourceUrl: youtubeUrl,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: message });

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

    } catch (err) {
        console.error(err);
        logCustom('error', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
        await sendMessageWithQuote(sock, remoteJid, message, `maaf, terjadi kesalahan coba lagi nanti`);
    }
}

module.exports = {
    handle,
    Commands: ['play'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};