const { setDemote } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    if (!content || !content.trim()) {
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @name telah di turunkan dari admin*_
        
_*List Variable*_

${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    await setDemote(remoteJid, content.trim());

    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Demote berhasil disetel_\n\n_Pastikan fitur sudah diaktifkan dengan *.on demote*_`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ["setdemote"],
    OnlyPremium: false,
    OnlyOwner: false,
};