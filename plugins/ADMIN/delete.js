const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, isQuoted, sender } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if (isQuoted) {
            await sock.sendMessage(remoteJid, {
                delete: {
                    remoteJid,
                    id: isQuoted.id,
                    participant: isQuoted.sender
                }
            });
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _Balas pesan yang mau dihapus_' },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error handling command:", error);
        await sock.sendMessage(remoteJid, { text: "❌ Terjadi kesalahan. Silakan coba lagi." });
    }
}

module.exports = {
    handle,
    Commands: ['delete','del','d'],
    OnlyPremium: false,
    OnlyOwner: false,
};