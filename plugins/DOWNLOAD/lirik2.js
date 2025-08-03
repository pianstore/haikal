const { logCustom } = require("@lib/logger");
const { fetchJson } = require("@lib/utils");
const { apikey } = require("@config");
const yts = require("yt-search");
const fetch = require("node-fetch");

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} the night we met*_`);
        }

        // Reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Ambil lirik
        const url = `${apikey.botz}/api/search/lirik?apikey=${apikey.key}&lirik=${encodeURIComponent(query)}`;
        const response = await fetchJson(url);

        if (response && response.result) {
            const ri = response.result;
            const lirikData = `_*Artist:*_ *${ri.artist}*\n\n_*Title:*_ *${ri.fullTitle}*\n\n${ri.lyrics}`;
            await sock.sendMessage(remoteJid, { image: { url: ri.image }, caption: lirikData }, { quoted: message });

            // Cari audio instrumental
            const search = await yts(`${query} instrumental`);
            const video = search.all.find(v => v.type === 'video' && v.seconds <= 1800);

            if (video && video.url) {
                const endpoint = `https://elrayyxml.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                const res = await fetch(endpoint);
                const audioRes = await res.json();

                if (audioRes?.status && audioRes?.result?.url) {
                    await sock.sendMessage(remoteJid, {
                        audio: { url: audioRes.result.url },
                        mimetype: "audio/mpeg"
                    }, { quoted: message });

                    await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
                } else {
                    await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
                    await sendMessageWithQuote(sock, remoteJid, message, '✅ Lirik berhasil, tapi gagal mengambil audio instrumental.');
                }
            } else {
                await sendMessageWithQuote(sock, remoteJid, message, '✅ Lirik berhasil, namun tidak ditemukan audio instrumental.');
            }

        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            const errorMessage = response?.message || "Maaf, tidak ada respons dari server. Silakan coba lagi nanti.";
            await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }
    } catch (error) {
        console.error("Kesalahan saat memproses:", error);

        // Filter semua URL dari pesan error
        const rawDetail = (error.message || error).toString();
        const cleanDetail = rawDetail.replace(/https?:\/\/[^\s]+/g, '[tautan disembunyikan]');

        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `⚠️ Maaf, terjadi kesalahan saat memproses permintaan.\n\n📄 *Detail:* ${cleanDetail}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['lirik2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};