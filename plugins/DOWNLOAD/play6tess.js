const fetch = require('node-fetch');
const CryptoJS = require('crypto-js');
const yts = require('yt-search');
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');

function generateToken() {
    const payload = JSON.stringify({ timestamp: Date.now() });
    const key = 'dyhQjAtqAyTIf3PdsKcJ6nMX1suz8ksZ';
    return CryptoJS.AES.encrypt(payload, key).toString();
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        let query = content?.trim();
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

        const response = await fetch('https://ds1.ezsrv.net/api/convert', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                url: youtubeUrl,
                quality: 128,
                trim: false,
                startT: 0,
                endT: 0,
                token: generateToken()
            })
        });

        const json = await response.json();

        if (!json?.url) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _gagal mengambil audio. coba link lain atau ulangi beberapa saat lagi._');
        }

        const title = json.title || videoData?.title || 'Audio YouTube';
        const thumbnail = json.thumbnail || videoData?.thumbnail || "https://telegra.ph/file/9d8373b6d6614b39c2c43.jpg";

        await sock.sendMessage(remoteJid, {
            audio: { url: json.url },
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
    Commands: ['play1'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};