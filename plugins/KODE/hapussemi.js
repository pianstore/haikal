const fs = require('fs');
const path = './database/kode.json';

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    if (fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify({}));
        return sock.sendMessage(remoteJid, {
            text: `✅ Semua code hadiah telah dihapus dari database.`
        }, { quoted: message });
    } else {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Database code tidak ditemukan.`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['hapusall'],
    OnlyOwner: true,
    OnlyPremium: false
};