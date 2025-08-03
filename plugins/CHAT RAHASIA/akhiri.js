const fs = require("fs");
const path = require("path");
const { reply } = require("@lib/utils");

const CONFESS_PATH = path.join(__dirname, "../../confess.json");

function loadConfessMap() {
    if (!fs.existsSync(CONFESS_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFESS_PATH));
}

function saveConfessMap(data) {
    fs.writeFileSync(CONFESS_PATH, JSON.stringify(data, null, 2));
}

async function handle(sock, messageInfo) {
    const { sender, m } = messageInfo;
    const confessMap = loadConfessMap();

    const target = confessMap[sender];
    if (!target) {
        return await reply(m, `❌ Kamu tidak sedang terhubung dengan siapa pun dalam sesi chat.`);
    }

    delete confessMap[sender];
    delete confessMap[target];
    saveConfessMap(confessMap);

    await reply(m, `✅ Sesi chat kamu telah diakhiri.`);
    await sock.sendMessage(target, {
        text: `⚠️ *Sesi chat kamu telah diakhiri oleh lawan bicaramu.*`
    });
}

module.exports = {
    handle,
    Commands: ["akhiri"],
    OnlyPremium: false,
    OnlyOwner: false
};