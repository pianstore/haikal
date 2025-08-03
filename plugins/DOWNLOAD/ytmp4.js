const fetch = require('node-fetch');
const yts = require('yt-search');
const config = require('@config');
const mess = require("@mess");
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');

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
        if (!content.trim() || !validLink) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} https://www.youtube.com/watch?v=xxxxx*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const videoId = getVideoId(validLink);
        if (!videoId) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _link YouTube tidak valid atau tidak didukung._');
        }

        const searchResult = await yts({ videoId });
        if (!searchResult || !searchResult.videoId) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan._');
        }

        const durationSec = searchResult.seconds || 0;
        if (durationSec > 900) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, video terlalu besar untuk dikirim melalui whatsapp._');
        }

        // Ganti ke endpoint ElrayyXml
        const apiUrl = `https://elrayyxml.vercel.app/downloader/ytmp4?url=${encodeURIComponent(validLink)}`;
        const response = await fetch(apiUrl).then(res => res.json());

        if (!response?.status || !response?.result?.url) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            await sendMessageWithQuote(sock, remoteJid, message, '⛔ _tidak dapat menemukan video yang sesuai_');
            return logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        }

        await sock.sendMessage(remoteJid, {
            video: { url: response.result.url },
            caption: `✅ *berhasil!*`,
        }, { quoted: message });

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error("Kesalahan saat proses:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
        await sendMessageWithQuote(sock, remoteJid, message, 'maaf, terjadi kesalahan saat memproses permintaan anda. mohon coba lagi nanti.');
    }
}

module.exports = {
    handle,
    Commands: ['ytmp4'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};