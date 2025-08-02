const mess = require('@mess');
const { addFiturBlock } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention } = require('@lib/utils');

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, content, prefix, command, mentionedJid } = messageInfo;

    if (!isGroup) return; // Hanya untuk grup

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!content) {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} pin*_`
            },
            { quoted: message }
        );
    }

    try {
        const fitur = content.trim();
        await addFiturBlock(remoteJid, fitur);
        await sendMessageWithMention(
            sock,
            remoteJid,
            `_Fitur *${fitur}* berhasil di-ban untuk grub ini_\n\n_Untuk membuka fitur, ketik *.unbanfitur*_`,
            message
        );
    } catch (error) {
        console.error(error);
        await sendMessageWithMention(
            sock,
            remoteJid,
            `❌ _Terjadi kesalahan saat mem-ban fitur_`,
            message
        );
    }
}

module.exports = {
    handle,
    Commands: ['banfitur'],
    OnlyPremium: true,
    OnlyOwner: false,
};