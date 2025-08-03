const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const config = require("@config");
const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

    try {
        // Kirim reaksi loading
        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const mediaType = isQuoted ? isQuoted.type : type;

        if (mediaType === "image" || mediaType === "video") {
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error("File media tidak ditemukan setelah diunduh.");
            }

            const buffer = fs.readFileSync(mediaPath);

            const options = {
                packname: config.sticker_packname,
                author: config.sticker_author,
            };

            await sendImageAsSticker(sock, remoteJid, buffer, options, message);

            fs.unlinkSync(mediaPath);

            // Kirim reaksi sukses
            await sock.sendMessage(remoteJid, {
                react: { text: "✅", key: message.key }
            });
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_` },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Terjadi kesalahan saat memproses stiker:", error);
        await sock.sendMessage(remoteJid, {
            text: "Maaf, terjadi kesalahan. Coba lagi nanti!"
        }, { quoted: message });

        // Kirim reaksi gagal
        await sock.sendMessage(remoteJid, {
            react: { text: "❌", key: message.key }
        });
    }
}

module.exports = {
    handle,
    Commands    : ["sticker", "stiker", "s"],
    OnlyPremium : false,
    OnlyOwner   : false
};