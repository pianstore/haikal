const axios = require("axios");
const config = require("@config");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ _*${prefix + command} haikal*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const sanitizedContent = encodeURIComponent(text.trim().replace(/\n+/g, " "));

        // Ambil GIF dari endpoint
        const response = await axios.get(`https://apizell.web.id/tools/bratanimate?q=${sanitizedContent}`, {
            responseType: 'arraybuffer'
        });
        const gifBuffer = Buffer.from(response.data);

        // Konversi ke stiker animasi dengan wa-sticker-formatter
        const sticker = new Sticker(gifBuffer, {
            type: StickerTypes.FULL,
            pack: config.sticker_packname,
            author: config.sticker_author,
            quality: 60,
            animated: true
        });

        const stickerBuffer = await sticker.toBuffer();

        // Kirim sebagai stiker animasi valid (.webp)
        await sock.sendMessage(remoteJid, {
            sticker: stickerBuffer
        }, { quoted: message });

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan.\n\nError: ${error.message}`;
        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['bratvid3'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};