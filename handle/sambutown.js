const fs = require('fs');
const path = require('path');
const config = require('@config');

const OWNER_NUMBER = config.owner_number.map(num => `${num}@s.whatsapp.net`);
const respondedSenders = new Map();

// ✅ Muat stiker sekali saat plugin dimuat
const stickerPath = path.join(__dirname, '../database/assets/hai.webp');
const stickerBuffer = fs.readFileSync(stickerPath);

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    if (!isGroup || !message || !sender) return;
    if (!OWNER_NUMBER.includes(sender)) return;

    const lastResponseTime = respondedSenders.get(sender) || 0;
    const currentTime = Date.now();

    if (currentTime - lastResponseTime < 10 * 60 * 1000) return;

    try {
        await sock.sendMessage(remoteJid, {
            sticker: stickerBuffer
        }, { quoted: message });

        respondedSenders.set(sender, currentTime);
    } catch (err) {
        console.error('Gagal kirim stiker dari buffer:', err);
    }
}

module.exports = {
    name: "OwnerStickerDelay",
    priority: 1,
    process
};