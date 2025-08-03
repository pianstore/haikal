const fs = require("fs");
const path = require("path");
const { reply } = require("@lib/utils");

const CONFESS_PATH = path.join(__dirname, "../../confess.json");

function saveConfessMap(data) {
    fs.writeFileSync(CONFESS_PATH, JSON.stringify(data, null, 2));
}

function loadConfessMap() {
    if (!fs.existsSync(CONFESS_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFESS_PATH));
}

async function handle(sock, messageInfo) {
    const { content, m, sender } = messageInfo;

    const [nomor, ...pesanParts] = content.split(" ");
    const isiPesan = pesanParts.join(" ");
    if (!nomor || !isiPesan) {
        return await reply(m, `Format salah.\nContoh: .chat 628xxxx Aku suka kamu.`);
    }

    const target = nomor.replace(/\D/g, "") + "@s.whatsapp.net";
    const confessMap = loadConfessMap();

    // Simpan dua arah
    confessMap[sender] = target;
    confessMap[target] = sender;
    saveConfessMap(confessMap);

    await sock.sendMessage(target, {
        text: `💌 *Pesan Rahasia!*

"${isiPesan}"



Balas chat? Gunakan:
.balas isi balasanmu

Ingin mengakhiri chat ini? Ketik:
.akhiri`
    });

    await reply(m, `✅ Pesan rahasia telah dikirim secara anonim.`);
}

module.exports = {
    handle,
    Commands: ["chat"],
    OnlyPremium: false,
    OnlyOwner: false
};