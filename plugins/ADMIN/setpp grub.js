const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");
const path = require("path");
const mess = require("@mess");

const mainDir = path.dirname(require.main.filename);

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, type, isQuoted, prefix, command, sender } = messageInfo;
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

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaType = isQuoted
            ? `${isQuoted.type}Message`
            : `${type}Message`;

        if (media && mediaType === "imageMessage") {
            const groupId = groupMetadata.id;
            const mediaPath = path.join(mainDir, "./tmp/", media);

            await sock.updateProfilePicture(groupId, { url: mediaPath });

            return await sock.sendMessage(
                remoteJid,
                { text: `_✅ Foto profil grup berhasil diperbarui_` },
                { quoted: message }
            );
        }

        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Kirim atau balas gambar dengan caption *${prefix + command}*_` },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error processing message:", error);
        await sock.sendMessage(remoteJid, {
            text: "❌ Terjadi kesalahan saat mengganti foto profil grup. Pastikan bot adalah admin.",
        });
    }
}

module.exports = {
    handle,
    Commands: ["setppgc", "setppgroub", "setppgrub", "setppgroup", "setppgrup"],
    OnlyPremium: false,
    OnlyOwner: false,
};