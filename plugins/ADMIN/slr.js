const mess = require('@mess');
const { addSlr } = require("@lib/slr");
const { getGroupMetadata } = require("@lib/cache");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, content, prefix, command, mentionedJid } = messageInfo;
    if (!isGroup) return;

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    if (!content) {
        const usage = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} admin sedang slow respon*_\n\n_Untuk mematikan fitur ini ketik *_${prefix}slr off_*_`;
        return await sock.sendMessage(remoteJid, { text: usage }, { quoted: message });
    }

    if (content.trim().toLowerCase() === 'off') {
        await addSlr(remoteJid, false, '');
        return await sock.sendMessage(remoteJid, { text: `✅ _SLR berhasil dimatikan_` }, { quoted: message });
    } else {
        await addSlr(remoteJid, true, content.trim());
        return await sock.sendMessage(remoteJid, { text: `✅ _SLR berhasil disetel_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['slr'],
    OnlyPremium: false,
    OnlyOwner: false,
};