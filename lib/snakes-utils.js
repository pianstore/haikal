const fs = require("fs");
const path = require("path");

async function kirimSticker(sock, remoteJid, namaFile, message) {
  try {
    const mediaPath = path.join(process.cwd(), 'database/assets', namaFile);
    if (!fs.existsSync(mediaPath)) throw new Error(`File tidak ditemukan: ${mediaPath}`);
    const buffer = fs.readFileSync(mediaPath);
    await sock.sendMessage(remoteJid, { sticker: buffer }, { quoted: message });
  } catch (error) {
    console.error('Gagal kirim stiker:', error.message);
  }
}

module.exports = {
  kirimSticker
};