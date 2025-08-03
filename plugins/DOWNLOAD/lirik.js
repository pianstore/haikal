const { logCustom } = require("@lib/logger");
const { fetchJson } = require("@lib/utils"); // Pastikan fetchJson sudah diimpor dengan benar
const { apikey } = require("@config");       // Mengambil apikey dari config.js

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input
        if (!content.trim() || content.trim() === '') {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} the night we meet*_`);
        }

        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Modifikasi URL agar sesuai dengan config.js
        const url = `${apikey.botz}/api/search/lirik?apikey=${apikey.key}&lirik=${encodeURIComponent(content)}`;
        const response = await fetchJson(url);

        if (response && response.result) {
            const ri = response.result;
            const lirikData = `_*Artist:*_ *${ri.artist}*\n\n_*Title:*_ *${ri.fullTitle}*\n\n${ri.lyrics}`;
            await sock.sendMessage(remoteJid, { image: { url: ri.image }, caption: lirikData }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            const errorMessage = response?.message || "Maaf, tidak ada respons dari server. Silakan coba lagi nanti.";
            await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }
    } catch (error) {
        console.error("Kesalahan saat memanggil API:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['lirik'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};