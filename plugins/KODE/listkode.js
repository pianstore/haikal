const fs = require('fs');
const path = './database/kode.json';

function loadCodes() {
    if (!fs.existsSync(path)) return {};
    return JSON.parse(fs.readFileSync(path));
}

function saveCodes(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function removeExpired(codes) {
    const now = Date.now();
    let changed = false;
    for (const code in codes) {
        if (codes[code].expireAt && codes[code].expireAt <= now) {
            delete codes[code];
            changed = true;
        }
    }
    return { cleaned: codes, changed };
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;
    let codes = loadCodes();

    const { cleaned, changed } = removeExpired(codes);
    if (changed) saveCodes(cleaned);
    codes = cleaned;

    if (Object.keys(codes).length === 0) {
        return sock.sendMessage(remoteJid, {
            text: `❌ *Belum ada code yang aktif.*`
        }, { quoted: message });
    }

    let replyText = `╭─〔 *DAFTAR CODE AKTIF* 〕─⬣\n\n`;
    const mentions = [];

    Object.entries(codes).forEach(([code, data], index) => {
        const sisaSlot = data.maxClaim - data.claimed.length;
        const creatorJid = data.creator || '';
        const creatorTag = `@${creatorJid.replace('@s.whatsapp.net', '')}`;
        const remainingMs = Math.max(0, data.expireAt - Date.now());
        const expireFormatted = formatTime(remainingMs);

        mentions.push(creatorJid);

        const pengklaim = data.claimed.length > 0
            ? data.claimed.map(jid => {
                mentions.push(jid);
                return `│   └ @${jid.replace('@s.whatsapp.net', '')}`;
            }).join('\n')
            : '│   (belum ada)';

        replyText += `│ *${index + 1}. Code:* ${code}
│ ├ Pembuat : ${creatorTag}
│ ├ Hadiah Sisa : 💰${data.remainingMoney}, 🎟️${data.remainingLimit}
│ ├ Ditukar : ${data.claimed.length} orang
│ ├ Sisa Slot : ${sisaSlot} orang
│ ├ Aktif : ${expireFormatted} (menit:detik)
│ └ Penukar :
${pengklaim}

`;
    });

    replyText += `╰───────⬣`;

    return sock.sendMessage(remoteJid, {
        text: replyText.trim(),
        mentions
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['listcode'],
    OnlyOwner: false,
    OnlyPremium: false
};