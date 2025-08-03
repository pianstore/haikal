const fs = require('fs');
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * Mengirimkan pesan kesalahan ke pengguna
 */
async function sendError(sock, remoteJid, message, errorMessage) {
    await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
}

/**
 * Memproses permintaan watermark untuk media
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted, type } = messageInfo;
    const mediaType = isQuoted ? isQuoted.type : type;

    try {
        const [packname = '', author = ''] = content.split('|').map(s => s.trim());

        if (!['image', 'sticker'].includes(mediaType)) {
            return sendError(sock, remoteJid, message,
                `⚠️ _Kirim/Balas gambar/stiker dengan caption *${prefix + command}*_`);
        }

        if (!content.trim()) {
            return sendError(sock, remoteJid, message,
                `_Contoh: *wm ʜᴀɪᴋᴀʟ*_\n\n_Contoh 1: wm ʜᴀɪᴋᴀʟ_\n_Contoh 2: wm ig | kall.v2_`);
        }

        // Kirim reaksi loading
        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const mediaPath = `./tmp/${
            isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message)
        }`;

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        const sticker = new Sticker(mediaPath, {
            pack: packname,
            author: author,
            type: StickerTypes.FULL,
            quality: 50
        });

        const buffer = await sticker.toBuffer();
        await sock.sendMessage(remoteJid, { sticker: buffer });

        // Kirim reaksi sukses
        await sock.sendMessage(remoteJid, {
            react: { text: "✅", key: message.key }
        });

    } catch (error) {
        await sendError(sock, remoteJid, message,
            `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nError: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['wm'],
    OnlyPremium: false,
    OnlyOwner: false
};