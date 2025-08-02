const mess = require('@mess');
const config = require("@config");
const { getGroupMetadata } = require("@lib/cache");
const { determineUser } = require('@lib/utils');

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, mentionedJid, isQuoted, content, prefix, command } = messageInfo;
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

        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        if (`${config.phone_number_bot}@s.whatsapp.net` === userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Tidak dapat kick nomor sendiri_` },
                { quoted: message }
            );
        }

        const kickResult = await sock.groupParticipantsUpdate(remoteJid, [userToAction], 'remove');
        if (kickResult && mess.action.user_kick) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.action.user_kick },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error('Error handling kick:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba mengeluarkan pengguna. Pastikan bot memiliki izin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['kick'],
    OnlyPremium: false,
    OnlyOwner: false,
};