const fs = require("fs");
const path = require("path");

const OWNER_NUMBERS = [
    "628891768169@s.whatsapp.net",
    "6285256833258@s.whatsapp.net"
];

// 🔁 Preload buffer saat file dimuat (sekali saja)
const stickerBuffer = fs.readFileSync(path.join(__dirname, "../database/assets/tag.webp"));

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;
    if (!isGroup || !message) return;

    const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const isOwnerMentioned = OWNER_NUMBERS.some(owner => mentionedJid.includes(owner));
    if (!isOwnerMentioned) return;

    try {
        // Kirim stiker dari buffer yang sudah dimuat
        await sock.sendMessage(remoteJid, {
            sticker: stickerBuffer
        }, { quoted: message });

    } catch (error) {
        console.error("Gagal mengirim stiker dari file (preloaded):", error);
    }
}

module.exports = {
    name: "OwnerSticker",
    priority: 11,
    process
};