const yts = require('yt-search');
const fetch = require('node-fetch');
const config = require('@config');
const { logCustom } = require("@lib/logger");

const loadingIntervals = {};

function startLoadingReaction(sock, message, id = 'default') {
    sendReaction(sock, message, '🕒');
    loadingIntervals[id] = true;
}

function stopLoadingReaction(id = 'default') {
    if (loadingIntervals[id]) {
        delete loadingIntervals[id];
    }
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function sendReaction(sock, message, reaction) {
    return sock.sendMessage(message.key.remoteJid, { react: { text: reaction, key: message.key } });
}

async function searchYouTube(query) {
    const searchResults = await yts(query);
    return searchResults.all.find(item => item.type === 'video') || searchResults.all[0];
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} the night we met*_`);
        }

        startLoadingReaction(sock, message, remoteJid);

        const video = await searchYouTube(query);
        if (!video || !video.url) {
            stopLoadingReaction(remoteJid);
            await sendReaction(sock, message, "❌");
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _tidak dapat menemukan video yang sesuai_');
        }

        if (video.seconds > 3600) {
            stopLoadingReaction(remoteJid);
            await sendReaction(sock, message, "❌");
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, audio terlalu besar untuk dikirim melalui whatsapp._');
        }

        let response, audioUrl;

        try {
            const res = await fetch(`https://api-yudzxzy.vercel.app/api/download/ytdl?url=${video.url}&format=mp3`);
            response = await res.json();
            audioUrl = response?.result?.download;

            if (!response?.status || !audioUrl) throw new Error("API pertama gagal.");
        } catch (e1) {
            await sendMessageWithQuote(sock, remoteJid, message, '🔄 apikey satu gagal, ganti ke apikey dua. harap sabar menunggu...');
            try {
                const res2 = await fetch(`${config.apikey.botz}/api/download/ytmp3?url=${encodeURIComponent(video.url)}&apikey=${config.apikey.key}`);
                const fallback = await res2.json();
                audioUrl = fallback?.result?.mp3;

                if (!audioUrl) throw new Error("API kedua gagal.");
            } catch (e2) {
                stopLoadingReaction(remoteJid);
                await sendReaction(sock, message, "❌");
                return sendMessageWithQuote(sock, remoteJid, message, `⚠️ maaf, terjadi kesalahan saat memproses permintaan anda.\n\n💡 silakan coba lagi nanti.`);
            }
        }

        await sock.sendMessage(remoteJid, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            contextInfo: {
                externalAdReply: {
                    title: video.title || "Untitled",
                    body: config.owner_name,
                    sourceUrl: video.url,
                    thumbnailUrl: video.thumbnail || "https://example.com/default_thumbnail.jpg",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: message });

        stopLoadingReaction(remoteJid);
        await sendReaction(sock, message, "✅");

    } catch (error) {
        console.error("Error while handling command:", error);
        stopLoadingReaction(remoteJid);
        await sendReaction(sock, message, "❌");
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendMessageWithQuote(sock, remoteJid, message, `⚠️ maaf, terjadi kesalahan saat memproses permintaan anda.\n\n💡 silakan coba lagi nanti.`);
    }
}

module.exports = {
    handle,
    Commands: ['play4'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};