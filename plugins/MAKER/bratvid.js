const fetch = require('node-fetch');
const config = require('@config');
const { sendImageAsSticker } = require('@lib/exif');
const { logCustom } = require('@lib/logger');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;
        
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} haikal*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const encodedText = encodeURIComponent(text.trim());
        const apiUrl = `https://elrayyxml.vercel.app/maker/brat-animated?text=${encodedText}&delay=600`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Gagal mengambil stiker dari server');

        const buffer = await response.buffer();

        await sendImageAsSticker(sock, remoteJid, buffer, {
            packname: config.sticker_packname,
            author: config.sticker_author,
        }, message);

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ maaf, terjadi kesalahan.\n\n📄 silakan coba lagi nanti.`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['bratvid'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};