const mess = require('@mess');
const { addUserBlock } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention, determineUser } = require('@lib/utils');

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, content, prefix, command, mentionedJid } = messageInfo;

    if (!isGroup) return; // Hanya untuk grup

    // Ambil metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === sender && p.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    // Tentukan target ban
    const userToBan = determineUser(mentionedJid, isQuoted, content);
    if (!userToBan) {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 6285256833258*_`
            },
            { quoted: message }
        );
    }

    const whatsappJid = userToBan;

    try {
        await addUserBlock(remoteJid, whatsappJid);
        await sendMessageWithMention(sock, remoteJid, `✅ @${whatsappJid.split('@')[0]} _Berhasil di-ban untuk grub ini_`, message);
    } catch (error) {
        console.error(error);
        await sendMessageWithMention(sock, remoteJid, `❌ _Tidak dapat ban nomor_ @${whatsappJid.split('@')[0]}`, message);
    }
}

module.exports = {
    handle,
    Commands: ['ban'],
    OnlyPremium: false,
    OnlyOwner: true,
};