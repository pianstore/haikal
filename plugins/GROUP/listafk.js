const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../database/users.json");

function readAllUsers() {
    if (!fs.existsSync(USERS_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
    return Object.entries(data).map(([id, user]) => ({ id, ...user }));
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    let parts = [];
    if (days) parts.push(`${days} hari`);
    if (hours) parts.push(`${hours} jam`);
    if (minutes) parts.push(`${minutes} menit`);
    if (seconds) parts.push(`${seconds} detik`);
    return parts.join(", ");
}

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;
    if (!isGroup) return;

    try {
        const users = readAllUsers();
        const afkUsers = users.filter(user => user.status === "afk");

        if (afkUsers.length === 0) {
            return await sock.sendMessage(remoteJid, {
                text: "Tidak ada member yang sedang AFK saat ini.",
            }, { quoted: message });
        }

        const list = afkUsers.map((user, i) => {
            const alasan = user.afk?.alasan || "Tanpa alasan";
            const waktu = user.afk?.lastChat ? new Date(user.afk.lastChat) : null;
            const durasi = waktu ? formatDuration(Date.now() - waktu.getTime()) : "Durasi tidak diketahui";
            return `${i + 1}. @${user.id.split("@")[0]}\n   • ${alasan}\n   • AFK selama: ${durasi}`;
        }).join("\n\n");

        await sock.sendMessage(remoteJid, {
            text: `📋 *daftar user afk:*\n\n${list}`,
            mentions: afkUsers.map(u => u.id),
        }, { quoted: message });

    } catch (error) {
        console.error("Error in listafk command:", error);
        await sock.sendMessage(remoteJid, {
            text: "❌ Gagal mengambil daftar AFK.",
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["listafk"],
    OnlyPremium: false,
    OnlyOwner: false
};