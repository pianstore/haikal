const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, message, isQuoted, prefix, command } = messageInfo;

    const channelJid = "120363403481814891@newsletter";

    try {
        const mediaType = isQuoted ? `${isQuoted.type}Message` : null;
        if (mediaType !== 'audioMessage') {
            return sock.sendMessage(remoteJid, {
                text: `⚠️ reply ke voice note/audio dengan perintah:\n${prefix + command}`,
            }, { quoted: message });
        }

        await sock.sendMessage(remoteJid, { react: { text: "🎙️", key: message.key } });

        const media = await downloadQuotedMedia(message);
        const filePath = path.join("tmp", media);
        if (!fs.existsSync(filePath)) throw new Error("gagal unduh audio.");

        const buffer = fs.readFileSync(filePath);
        await sock.sendMessage(channelJid, {
            audio: buffer,
            mimetype: 'audio/mp4',
            ptt: true
        });

        await sock.sendMessage(remoteJid, {
            text: `✅ voice note berhasil dikirim ke saluran.`,
        }, { quoted: message });

    } catch (err) {
        console.error("gagal kirim VN:", err);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ gagal kirim audio:\n${err.message || err}`,
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['slaudio'],
    OnlyPremium: false,
    OnlyOwner: true
};