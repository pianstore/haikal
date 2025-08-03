const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, type, prefix, command } = messageInfo;

    try {
        if (!content || content.trim() === '') {
            return sendErrorMessage(sock, remoteJid, message, prefix, command);
        }

        const pesan = content.trim();
        const channelJid = "120363403481814891@newsletter";

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

        if (mediaType === 'imageMessage') {
            const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
            const filePath = path.join("tmp", media);
            if (!fs.existsSync(filePath)) throw new Error("media tidak ditemukan.");
            const buffer = fs.readFileSync(filePath);

            await sock.sendMessage(channelJid, { image: buffer, caption: pesan });
        } else {
            await sock.sendMessage(channelJid, { text: pesan });
        }

        await sock.sendMessage(remoteJid, { text: `✅ pesan berhasil dikirim ke saluran.` }, { quoted: message });

    } catch (err) {
        console.error("gagal kirim:", err);
        await sock.sendMessage(remoteJid, { text: `⚠️ gagal kirim:\n${err.message}` }, { quoted: message });
    }
}

function sendErrorMessage(sock, remoteJid, message, prefix, command) {
    return sock.sendMessage(remoteJid, {
        text: `📌 format:\n${prefix + command} ini isi pesan yang dikirim ke saluran.`
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['slchat'],
    OnlyPremium: false,
    OnlyOwner: true
};