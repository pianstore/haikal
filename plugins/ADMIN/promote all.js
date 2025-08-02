// PROMOTE: Menjadikan semua anggota menjadi admin
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

        // Filter hanya member yang belum admin
        const nonAdmins = participants
            .filter(participant => !participant.admin)
            .map(participant => participant.id);

        if (nonAdmins.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: "_Semua anggota sudah menjadi admin._" },
                { quoted: message }
            );
        }

        await sock.groupParticipantsUpdate(remoteJid, nonAdmins, 'promote');

        await sendMessageWithMention(
            sock,
            remoteJid,
            `*${nonAdmins.length}* _anggota telah dipromosikan menjadi admin._`,
            message
        );
    } catch (error) {
        console.error("Error in promoteall command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menaikkan anggota menjadi admin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['promoteall'],
    OnlyPremium: false,
    OnlyOwner: false
};