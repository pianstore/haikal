const yts = require('yt-search');
const fetch = require('node-fetch');
const ApiAutoresbot = require('api-autoresbot');
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
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} the night we met*_`
            );
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
            return sendMessageWithQuote(sock, remoteJid, message, '_maaf, video terlalu besar untuk dikirim melalui whatsapp._');
        }

        let audioUrl = null;

        // === 1. API AUTOREBOT ===
        try {
            const api = new ApiAutoresbot(config.APIKEY);
            const response = await api.get('/api/downloader/ytplay', {
                url: video.url,
                format: 'm4a'
            });

            if (response && response.status && response.url && response.bytes <= 94491648) {
                audioUrl = response.url;
            }
        } catch (e) {
            console.log("Autoresbot API failed, fallback to Yudzxzy...");
            await sendMessageWithQuote(sock, remoteJid, message, '*🔄 apikey satu gagal, ganti ke apikey dua. harap sabar menunggu...*');
        }

        // === 2. API YUDZXZY ===
        if (!audioUrl) {
            try {
                const res = await fetch(`https://api-yudzxzy.vercel.app/api/download/ytdl?url=${encodeURIComponent(video.url)}&format=mp3`);
                const response = await res.json();

                if (response?.status && response?.result?.download) {
                    audioUrl = response.result.download;
                } else {
                    throw new Error('API Yudzxzy gagal');
                }
            } catch (err) {
                console.log("Yudzxzy API failed, fallback to BetaBotz...");
                await sendMessageWithQuote(sock, remoteJid, message, '*🔄 apikey dua gagal, ganti ke apikey tiga. harap sabar menunggu...*');
            }
        }

        // === 3. API BETABOTZ ===
        if (!audioUrl) {
            try {
                const res = await fetch(`${config.apikey.botz}/api/download/ytmp3?url=${encodeURIComponent(video.url)}&apikey=${config.apikey.key}`);
                const response = await res.json();

                if (response?.result?.mp3) {
                    audioUrl = response.result.mp3;
                } else {
                    throw new Error('Gagal mendapatkan audio dari BetaBotz');
                }
            } catch (err) {
                console.error("Fallback ketiga (BetaBotz) juga gagal:", err);
            }
        }

        if (!audioUrl) {
            stopLoadingReaction(remoteJid);
            await sendReaction(sock, message, "❌");
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _semua sumber API gagal. coba lagi nanti atau hubungi pemilik bot._');
        }

        await sock.sendMessage(remoteJid, {
            audio: { url: audioUrl },
            mimetype: "audio/mp4",
            contextInfo: {
                externalAdReply: {
                    title: video.title || "Untitled",
                    body: config.owner_name,
                    sourceUrl: video.url,
                    thumbnailUrl: video.thumbnail || "https://example.com/default_thumbnail.jpg",
                    mediaType: 1,
                    renderLargerThumbnail:false
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
        const errorMessage = `⚠️ Maaf, terjadi kesalahan saat memproses permintaan Anda.\n\n💡 Silakan coba lagi nanti.`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['play3'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};