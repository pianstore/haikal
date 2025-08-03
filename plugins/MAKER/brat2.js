const axios = require('axios');
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} haikal*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const sanitizedContent = encodeURIComponent(text.trim().replace(/\n+/g, " "));
        const apiUrl = `https://apizell.web.id/tools/brat?q=${sanitizedContent}`;

        let buffer = false;
        try {
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer'
            });
            buffer = response.data;
        } catch (e) {
            buffer = false;
        }

        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
        };

        if (buffer) {
            await sendImageAsSticker(sock, remoteJid, buffer, options, message);
        } else {
            await sock.sendMessage(remoteJid, {
                text: '❌ Gagal mengambil gambar dari endpoint. Coba lagi atau periksa URL-nya.'
            }, { quoted: message });
        }

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['brat2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};