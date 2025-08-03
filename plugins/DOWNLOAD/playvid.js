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
        if (!content.trim()) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} judul lagu / link youtube*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        let link = extractLink(content);
        let videoMeta;

        if (!link) {
            const search = await yts(content);
            if (!search || !search.videos.length) {
                await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
                return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan dari judul tersebut._');
            }

            const video = search.videos[0];
            link = video.url;
            videoMeta = video;
        }

        const videoId = getVideoId(link);
        if (!videoId) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _link YouTube tidak valid atau tidak didukung._');
        }

        if (!videoMeta) {
            const { videos } = await yts({ videoId });
            videoMeta = videos.find(v => v.videoId === videoId);
            if (!videoMeta) {
                await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
                return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan._');
            }
        }

        const durationSec = videoMeta.seconds || 0;
        if (durationSec > 900) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, video terlalu besar untuk dikirim melalui whatsapp._');
        }

        // ✅ Ganti dengan endpoint ElrayyXml
        const apiUrl = `https://elrayyxml.vercel.app/downloader/ytmp4?url=${encodeURIComponent(link)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data?.status || !data?.result?.url) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            await sendMessageWithQuote(sock, remoteJid, message, '⛔ _tidak dapat menemukan video yang sesuai_');
            return logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        }

        await sock.sendMessage(remoteJid, {
            video: { url: data.result.url },
            caption: `✅ *berhasil!*\n\n🎥 judul: ${data.result.title || videoMeta?.title || 'tidak tersedia'}`,
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
    Commands: ['playvid'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};