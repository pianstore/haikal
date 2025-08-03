const fs = require('fs');
const path = './database/kode.json';

function loadCodes() {
    if (!fs.existsSync(path)) return {};
    return JSON.parse(fs.readFileSync(path));
}

function saveCodes(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function removeExpiredCodes(codes) {
    const now = Date.now();
    let removed = false;
    for (const code in codes) {
        if (codes[code].expireAt && codes[code].expireAt <= now) {
            delete codes[code];
            removed = true;
        }
    }
    return removed;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;
    const code = content.trim();

    let codes = loadCodes();
    const expiredRemoved = removeExpiredCodes(codes);
    if (expiredRemoved) saveCodes(codes);

    if (!code) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Masukkan code yang ingin dihapus

 Contoh:  .hapuscode Hadiah09`
        }, { quoted: message });
    }

    if (!codes[code]) {
        return sock.sendMessage(remoteJid, {
            text: `❌ code *${code}* tidak ditemukan dalam database atau sudah kedaluwarsa.`
        }, { quoted: message });
    }

    delete codes[code];
    saveCodes(codes);

    return sock.sendMessage(remoteJid, {
        text: `✅ code *${code}* berhasil dihapus dari database.`
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['hapuscode'],
    OnlyOwner: true,
    OnlyPremium: false
};