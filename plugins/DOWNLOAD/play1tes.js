const yts = require('yt-search');
const axios = require('axios');
const { logCustom } = require("@lib/logger");
const config = require('@config');

// Fungsi untuk mengirim kutipan teks
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Fungsi untuk kirim reaksi emoji
async function sendReaction(sock, message, reaction) {
    return sock.sendMessage(message.key.remoteJid, {
        react: { text: reaction, key: message.key }
    });
}

// Fungsi pencarian YouTube
async function searchYouTube(query) {
    const searchResults = await yts(query);
    return searchResults.all.find(item => item.type === 'video') || searchResults.all[0];
}

// Fungsi utama
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} the night we meet*_`
            );
        }

        await sendReaction(sock, message, "⏰");

        const video = await searchYouTube(query);
        if (!video || !video.url) {
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _video tidak ditemukan._');
        }

        if (video.seconds > 1000) {
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, durasi video melebihi batas 1 jam._');
        }

        const { data } = await axios.get(`https://elrayyxml.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`);
        if (!data?.status || !data.result?.url) {
            await sendReaction(sock, message, "❗");
            return sendMessageWithQuote(sock, remoteJid, message, `❌ gagal mengunduh audio dari api.`);
        }

        const thumbnail = video.thumbnail || "https://telegra.ph/file/9d8373b6d6614b39c2c43.jpg";

        // Kirim 1 pesan audio dengan externalAdReply
        await sock.sendMessage(remoteJid, {
            audio: { url: data.result.url },
            fileName: `${data.result.title}.mp3`,
            mimetype: 'audio/mp4',
            contextInfo: {
                externalAdReply: {
                    title: data.result.title,
                    body: "ʜᴀɪᴋᴀʟ",
                    thumbnailUrl: thumbnail,
                    sourceUrl: video.url,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error("Error while handling command:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        const errorMessage = `⚠️ terjadi kesalahan saat memproses permintaan anda.\n\n💡 detail: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['play6'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};