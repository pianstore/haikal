const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function sendTextMessage(sock, remoteJid, text, quoted) {
    return await sock.sendMessage(remoteJid, { text }, { quoted });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, content, isQuoted, isGroup } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;

        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        const messageContent = content?.trim() || "kosong";

        let teks = `══✪〘 *👥 Tag All* 〙✪══\n➲ *Pesan: ${messageContent}*\n\n`;
        const mentions = participants.map((member) => {
            teks += `⭔ @${member.id.split("@")[0]}\n`;
            return member.id;
        });

        await sock.sendMessage(
            remoteJid,
            { text: teks, mentions },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error:", error);
        await sendTextMessage(sock, remoteJid, `⚠️ Terjadi kesalahan: ${error.message}`, message);
    }
}

module.exports = {
    handle,
    Commands: ["tagall"],
    OnlyPremium: false,
    OnlyOwner: false
};