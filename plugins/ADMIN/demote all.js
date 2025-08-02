// DEMOTE ALL: Menjadikan semua admin menjadi user biasa
const mess = require("@mess");
const { sendMessageWithMention } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
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

        const admins = participants
            .filter((participant) => participant.admin)
            .map((participant) => participant.id);

        if (admins.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: "Tidak ada admin yang bisa diturunkan." },
                { quoted: message }
            );
        }

        await sock.groupParticipantsUpdate(remoteJid, admins, 'demote');

        await sendMessageWithMention(
            sock,
            remoteJid,
            `*${admins.length}* _admin telah diturunkan menjadi user biasa._`,
            message
        );
    } catch (error) {
        console.error("Error in demoteall command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menurunkan admin menjadi user biasa.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['demoteall'],
    OnlyPremium: false,
    OnlyOwner: false,
};