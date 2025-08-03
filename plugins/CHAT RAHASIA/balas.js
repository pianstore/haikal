const fs = require("fs");
const path = require("path");
const { reply } = require("@lib/utils");

const CONFESS_PATH = path.join(__dirname, "../../confess.json");

function loadConfessMap() {
    if (!fs.existsSync(CONFESS_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFESS_PATH));
}

async function handle(sock, messageInfo) {
    const { content, m, sender } = messageInfo;

    if (!content) {
        return await reply(m, `Tulis balasanmu. Contoh:
.balas Aku juga suka kamu!`);
    }

    const confessMap = loadConfessMap();
    const target = confessMap[sender];

    if (!target) {
        return await reply(m, `❌ Tidak ada riwayat chat yang bisa dibalas.`);
    }

    await sock.sendMessage(target, {
        text: `📩 *Balasan Anonim!*

"${content}"



Kamu juga bisa membalas dengan perintah:
.balas pesan balasanmu

Ingin mengakhiri sesi ini? Ketik:
.akhiri`
    });

    await reply(m, `✅ Balasan terkirim secara anonim.`);
}

module.exports = {
    handle,
    Commands: ["balas"],
    OnlyPremium: false,
    OnlyOwner: false
};