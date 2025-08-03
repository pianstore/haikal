const fetch = require('node-fetch');
const yts = require('yt-search');
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function sendReaction(sock, message, reaction) {
    return sock.sendMessage(message.key.remoteJid, {
        react: { text: reaction, key: message.key }
    });
}

async function searchYouTube(query) {
    const res = await yts(query);
    return res.all.find(v => v.type === 'video') || res.videos[0];
}

const ytmp3mobi = async (youtubeUrl) => {
    const regYoutubeId = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([^&|^?]+)/;
    const videoId = youtubeUrl.match(regYoutubeId)?.[1];
    if (!videoId) throw Error("❌ Tidak bisa ekstrak video ID dari link.");

    const headers = { "Referer": "https://id.ytmp3.mobi/" };
    const urlParam = { v: videoId, f: "mp3", _: Math.random() };

    const fetchJson = async (url, label) => {
        const res = await fetch(url, { headers });
        if (!res.ok) throw Error(`❌ Gagal fetch ${label}: ${res.statusText}`);
        return await res.json();
    };

    const { convertURL } = await fetchJson("https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=" + Math.random(), "init");
    const { progressURL, downloadURL } = await fetchJson(`${convertURL}&${new URLSearchParams(urlParam)}`, "convert");

    let progress = 0, title = "", error;
    while (progress !== 3) {
        ({ error, progress, title } = await fetchJson(progressURL, "progress"));
        if (error) throw Error(`❌ Error dari server: ${error}`);
    }

    return { title, downloadURL, videoId };
};

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, command } = messageInfo;

    try {
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(sock, remoteJid, message,
                `⚠️ *contoh penggunaan:*\n.${command} the night we meet`);
        }

        await sendReaction(sock, message, "🔍");

        const video = await searchYouTube(query);
        if (!video || !video.url) {
            return sendMessageWithQuote(sock, remoteJid, message, "❌ Video tidak ditemukan.");
        }

        await sendReaction(sock, message, "⏰");

        const { title, downloadURL, videoId } = await ytmp3mobi(video.url);
        const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        await sock.sendMessage(remoteJid, {
            audio: { url: downloadURL },
            fileName: `${title}.mp3`,
            mimetype: 'audio/mp4',
            contextInfo: {
                externalAdReply: {
                    title,
                    body: "ʜᴀɪᴋᴀʟ",
                    thumbnailUrl: thumbnail,
                    sourceUrl: video.url,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: message });

    } catch (err) {
        console.error(err);
        logCustom('ytmp3mobi-search', content, 'ERROR-ytmp3mobi.txt');
        await sendReaction(sock, message, "❌");
        await sendMessageWithQuote(sock, remoteJid, message,
            `❌ Terjadi kesalahan:\n${err.message || err}`);
    }
}

module.exports = {
    handle,
    Commands: ['playtes'],
    OnlyPremium: false,
    OnlyOwner: true,
    limitDeduction: 1,
};