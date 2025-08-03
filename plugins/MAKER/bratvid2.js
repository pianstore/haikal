const axios = require('axios');
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");
const { logCustom } = require("@lib/logger");

async function sendRequest(text) {
    const query = encodeURIComponent(text.trim().replace(/\s+/g, " "));
    const url = `${config.apikey.botz}/api/maker/brat-video?text=${query}&apikey=${config.apikey.key}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} ʜᴀɪᴋᴀʟ*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        let buffer;
        try {
            // Coba dengan emoji (asli)
            buffer = await sendRequest(text);
        } catch (err) {
            // Jika gagal, fallback ke versi teks tanpa emoji
            const fallbackText = text
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\p{L}\p{N}\s]/gu, "")
                .replace(/\s+/g, " ")
                .trim();
            buffer = await sendRequest(fallbackText);
        }

        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
        };

        await sendImageAsSticker(sock, remoteJid, buffer, options, message);

        await sock.sendMessage(remoteJid, {
            react: { text: "✅", key: message.key }
        });

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nError: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['bratvid2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};