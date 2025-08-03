const fs = require('fs');
const path = './database/kode.json';
const { findUser, updateUser } = require('@lib/users');

function loadCodes() {
    if (!fs.existsSync(path)) return {};
    return JSON.parse(fs.readFileSync(path));
}

function saveCodes(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender } = messageInfo;
    const code = content.trim();

    if (!code) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Masukkan code yang ingin ditukar

 contoh: .tukarcode Hadiah01`
        }, { quoted: message });
    }

    let codes = loadCodes();
    const data = codes[code];

    if (!data) return sock.sendMessage(remoteJid, {
        text: `❌ code tidak ditemukan atau sudah kedaluwarsa.`
    }, { quoted: message });

    const now = Date.now();
    if (data.expireAt && data.expireAt <= now) {
        delete codes[code];
        saveCodes(codes);
        return sock.sendMessage(remoteJid, {
            text: `❌ code *${code}* sudah kedaluwarsa.`
        }, { quoted: message });
    }

    if (data.claimed.includes(sender)) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Kamu sudah pernah menukarkan code ini.`
        }, { quoted: message });
    }

    if (data.claimed.length >= data.maxClaim) {
        delete codes[code];
        saveCodes(codes);
        return sock.sendMessage(remoteJid, {
            text: `❌ code ini sudah habis ditukar.`
        }, { quoted: message });
    }

    let moneyBonus, limitBonus;
    if (data.claimed.length === 0) {
        moneyBonus = Math.floor(data.money * 0.4);
        limitBonus = Math.floor(data.limit * 0.4);
    } else {
        const sisaClaim = data.maxClaim - data.claimed.length;
        moneyBonus = Math.floor(data.remainingMoney / sisaClaim);
        limitBonus = Math.floor(data.remainingLimit / sisaClaim);
    }

    const user = await findUser(sender);
    if (!user) return sock.sendMessage(remoteJid, {
        text: `⚠️ Pengguna tidak ditemukan di database.`
    }, { quoted: message });

    await updateUser(sender, {
        limit: (user.limit || 0) + limitBonus,
        money: (user.money || 0) + moneyBonus
    });

    data.remainingMoney -= moneyBonus;
    data.remainingLimit -= limitBonus;
    data.claimed.push(sender);

    if (data.claimed.length >= data.maxClaim) {
        delete codes[code];
    } else {
        codes[code] = data;
    }

    saveCodes(codes);

    return sock.sendMessage(remoteJid, {
        text: `*✅ Penukaran Berhasil!*\n\ncode: *${code}*\n💰 Bonus: *${moneyBonus}* money\n📦 Limit: *${limitBonus}* limit\n\nGunakan hadiahmu dengan bijak!`
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['tukarcode'],
    OnlyOwner: false,
    OnlyPremium: false
};