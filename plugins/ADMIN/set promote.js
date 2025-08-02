const { setPromote } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;
    if (!isGroup) return;

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    const isAdmin = participants.some(p => p.id === sender && p.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    if (!content || !content.trim()) {
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} Selamat @name sekarang menjadi admin*_
        
_*List Variable*_

${global.group.variable}`;
        return await sock.sendMessage(remoteJid, { text: MSG }, { quoted: message });
    }

    await setPromote(remoteJid, content.trim());

    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Pesan promote berhasil disetel_\n\n_Pastikan fitur sudah diaktifkan dengan *.on promote*_`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ["setpromote"],
    OnlyPremium: false,
    OnlyOwner: false,
};