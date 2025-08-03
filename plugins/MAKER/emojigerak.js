const axios = require("axios");
const config = require("@config");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { logCustom } = require("@lib/logger");

function isEmojiOnly(text) {
    return /^[\p{Emoji}\p{Extended_Pictographic}]+$/u.test(text.trim());
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ _*${prefix + command} 🤩*_`
            }, { quoted: message });
            return;
        }

        if (!isEmojiOnly(text)) {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ Input hanya boleh emoji, tanpa huruf atau angka.\n\n💬 _Contoh valid:_ _*${prefix + command} 🤩*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const emoji = encodeURIComponent(text.trim());
        const endpoint = `https://api.alyachan.dev/api/emojito?emoji=${emoji}&apikey=brziko`;

        const { data } = await axios.get(endpoint);
        if (!data?.status || !data?.data?.url) {
            throw new Error('Respon API tidak valid atau emoji tidak didukung.');
        }

        const stickerResponse = await axios.get(data.data.url, { responseType: 'arraybuffer' });
        const gifBuffer = Buffer.from(stickerResponse.data);

        const sticker = new Sticker(gifBuffer, {
            type: StickerTypes.FULL,
            pack: config.sticker_packname,
            author: config.sticker_author,
            quality: 60,
            animated: true
        });

        const stickerBuffer = await sticker.toBuffer();

        await sock.sendMessage(remoteJid, {
            sticker: stickerBuffer
        }, { quoted: message });

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Maaf, terjadi kesalahan saat memproses emoji tersebut.\n\n📄 Silakan coba lagi nanti atau gunakan emoji lain.`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['emojigerak'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};