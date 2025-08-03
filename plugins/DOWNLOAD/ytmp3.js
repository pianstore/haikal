const fetch = require('node-fetch');
const yts = require('yt-search');
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');

// Fungsi ambil videoId dari URL YouTube
function getVideoId(url) {
    const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const validLink = extractLink(content);
        if (!validLink) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} https://www.youtube.com/watch?v=xxxxx*_`);
        }

        const videoId = getVideoId(validLink);
        if (!videoId) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _link youtube tidak valid atau tidak didukung._');
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // 🔍 Ambil metadata video dengan yts
        const searchResult = await yts({ videoId });
        if (!searchResult || !searchResult.videoId) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan._');
        }

        const durationSec = searchResult.seconds || 0;
        if (durationSec > 900) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, audio terlalu besar untuk dikirim melalui whatsapp._');
        }

        // ✅ Gunakan endpoint ElrayyXml
        const endpoint = `https://elrayyxml.vercel.app/downloader/ytmp3?url=${encodeURIComponent(validLink)}`;
        const res = await fetch(endpoint);
        const response = await res.json();

        if (response?.status && response?.result?.url) {
            await sock.sendMessage(remoteJid, {
                audio: { url: response.result.url },
                mimetype: 'audio/mpeg',
                fileName: `${response.result.title}.mp3`
            }, { quoted: message });

            await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            await sendMessageWithQuote(sock, remoteJid, message, 'maaf, tidak dapat menemukan audio dari URL yang Anda berikan.');
        }

    } catch (error) {
        console.error("Kesalahan:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
        await sendMessageWithQuote(sock, remoteJid, message, 'maaf, terjadi kesalahan saat memproses permintaan anda.\n\n💡 silakan coba lagi nanti.');
    }
}

module.exports = {
    handle,
    Commands: ['ytmp3'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};