// DEMOTE: Menurunkan admin ke user biasa
const mess = require("@mess");
const { determineUser } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, mentionedJid, content, isQuoted, prefix, command } = messageInfo;
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

        const userToDemote = determineUser(mentionedJid, isQuoted, content);
        if (!userToDemote) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @NAME*_`
                },
                { quoted: message }
            );
        }

        await sock.groupParticipantsUpdate(remoteJid, [userToDemote], 'demote');
        // Notifikasi dihapus, tidak ada pesan konfirmasi

    } catch (error) {
        console.error("Error in demote command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menurunkan admin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['demote'],
    OnlyPremium: false,
    OnlyOwner: false,
};