const axios = require('axios');
const { getBuffer } = require("@lib/utils");
const mess = require('@mess');
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
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
                `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} kucing lucu*_`
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const res = await axios.get(`https://elrayyxml.vercel.app/search/pinterest?q=${encodeURIComponent(query)}`);
        const data = res.data;

        if (!data?.status || !data.result || data.result.length === 0) {
            return sendMessageWithQuote(sock, remoteJid, message, '❌ gambar tidak ditemukan.');
        }

        // Ambil 1 gambar acak
        const random = data.result[Math.floor(Math.random() * data.result.length)];

        return await sock.sendMessage(remoteJid, {
            image: { url: random.images_url },
            caption: `✅hasil pencarian: *${query}*`,
            buttons: [
                {
                    buttonId: `${prefix + command} ${query}`,
                    buttonText: { displayText: "next" },
                    type: 1
                }
            ],
            headerType: 4
        }, { quoted: message });

    } catch (error) {
        console.error("Error while fetching Pinterest image:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `❗ terjadi kesalahan saat mengambil gambar dari pinterest.\n\n💡 detail: ${error.message || error}`;
        return sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['pinterest2', 'pin2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};