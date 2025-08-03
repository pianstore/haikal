const fs = require('fs');
const path = './database/kode.json';

function loadCodes() {
    if (!fs.existsSync(path)) return {};
    return JSON.parse(fs.readFileSync(path));
}

function saveCodes(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command } = messageInfo;

    const args = content.trim().split(' ');
    if (args.length < 5) {
        return sock.sendMessage(remoteJid, {
            text: `
⚠️ Format Tidak Valid

Format: .${command} code money limit user menit

Contoh: .${command} Hadiah09 10 10 3 15`.trim()
        }, { quoted: message });
    }

    const [code, moneyStr, limitStr, maxclaimStr, expireMinuteStr] = args;
    const money = parseInt(moneyStr);
    const limit = parseInt(limitStr);
    const maxClaim = parseInt(maxclaimStr);
    const expireMinute = parseInt(expireMinuteStr);

    if ([money, limit, maxClaim, expireMinute].some(n => isNaN(n) || n <= 0)) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Format angka salah.`
        }, { quoted: message });
    }

    const codes = loadCodes();
    if (codes[code]) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ code *${code}* sudah ada, gunakan code lain.`
        }, { quoted: message });
    }

    codes[code] = {
        creator: sender,
        limit,
        money,
        maxClaim,
        claimed: [],
        remainingMoney: money,
        remainingLimit: limit,
        expireAt: Date.now() + expireMinute * 60000
    };

    saveCodes(codes);

    return sock.sendMessage(remoteJid, {
        text: `
━━━━━━━━━━━━━━━━━━━━━━
         🎁 *Code Hadiah Dibuat*
━━━━━━━━━━━━━━━━━━━━━━
🔑 code       : ${code}
👤 Pembuat    : @${sender.split('@')[0]}
💰 Money      : ${money} 
📦 Limit      : ${limit}
👥 Max Klaim  : ${maxClaim} orang
⏳ Aktif      : ${expireMinute} menit
━━━━━━━━━━━━━━━━━━━━━━
📌 Contoh penukaran code
📥 Ketik: .tukarcode ${code}
━━━━━━━━━━━━━━━━━━━━━━`.trim(),
        mentions: [sender]
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['buatcode'],
    OnlyOwner: true,
    OnlyPremium: false
};