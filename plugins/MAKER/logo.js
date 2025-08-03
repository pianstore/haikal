const axios         = require('axios');
const config        = require("@config");
const mess          = require('@mess');
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input kosong
        if (!content.trim()) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ *${prefix + command} buatkan logo untuk kedai kopi moderen*`);
        }

        // Kirim emoji loading
        await sock.sendMessage(remoteJid, { react: { text: "🧠", key: message.key } });

        // Panggil endpoint logo
        const response = await axios.get('https://nirkyy-dev.hf.space/api/v1/logo-gen', {
            params: {
                prompt: content.trim()
            },
            responseType: 'arraybuffer'
        });

        // Kirim gambar jika berhasil
        if (response.status === 200) {
            return await sock.sendMessage(remoteJid, {
                image: Buffer.from(response.data),
                caption: `🖼️ *Hasil Logo:*\n\n✅ _Berhasil membuat logo dari prompt kamu_`
            }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            return sendMessageWithQuote(sock, remoteJid, message, `⚠️ Gagal mengambil logo. Silakan coba lagi.`);
        }

    } catch (error) {
        console.error("Kesalahan saat memanggil endpoint logo:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `⚠️ Terjadi kesalahan saat memproses permintaan.\n\nDetail: ${error.message || error}`;
        return sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands        : ['logo'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};