const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');
const createSlideshowVideo = require('@lib/createSlideshowVideo');

function isTikTokUrl(url) {
    return /tiktok\.com|vt\.tiktok\.com/i.test(url);
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const validLink = extractLink(content);
        if (!content?.trim() || !isTikTokUrl(validLink)) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ format penggunaan:_\n\n_💬 contoh:_ *${prefix + command} https://vt.tiktok.com/ZSxxxxxx/*`
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const { data } = await axios.get(`https://elrayyxml.vercel.app/downloader/tiktok?url=${encodeURIComponent(validLink)}`);
        if (!data || !data.status || !data.result) {
            throw new Error("gagal mengambil data dari API.");
        }

        const res = data.result;

        // === KASUS FOTO LEBIH DARI SATU ===
        if (Array.isArray(res.images) && res.images.length > 1) {
            for (let i = 0; i < res.images.length; i++) {
                await sock.sendMessage(remoteJid, {
                    image: { url: res.images[i] },
                    caption: `🖼️ gambar ${i + 1} dari ${res.images.length}`
                }, { quoted: message });
            }
            await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
            return;
        }

        // === KASUS FOTO 1 === → buat slideshow video
        if (Array.isArray(res.images) && res.images.length === 1) {
            const outputPath = path.join(process.cwd(), `tmp/slideshow_${Date.now()}.mp4`);
            const imageArray = res.images.map(img => ({ img }));
            const musicUrl = res.music;

            await createSlideshowVideo(imageArray, outputPath, musicUrl);

            const videoBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(remoteJid, {
                video: videoBuffer,
                caption: '📸 image convert to video'
            }, { quoted: message });

            await fs.remove(outputPath);
            await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
            return;
        }

        // === KASUS VIDEO BIASA ===
        const videoUrl = res.hdplay || res.play;
        if (!videoUrl) throw new Error("link video tidak ditemukan.");

        await sock.sendMessage(remoteJid, {
            video: { url: videoUrl },
            caption: res.title || '📹 berikut video tiktok-nya.'
        }, { quoted: message });

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error("❌ kesalahan:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        const errMsg = `❌ gagal memproses tiktok.\n\n*detail:* ${error.message || 'tidak diketahui'}`;
        await sendMessageWithQuote(sock, remoteJid, message, errMsg);
    }
}

module.exports = {
    handle,
    Commands: ['tiktok','tt','ttslide','tiktokslide'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};