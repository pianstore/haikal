const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    if (!isGroup) {
        await sock.sendMessage(remoteJid, { text: mess.general.isGroup }, { quoted: message });
        return;
    }

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === sender && p.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    try {
        const participantIds = participants.map(p => p.id);

        await sock.sendMessage(remoteJid, {
            text: `✅ Grup *${groupMetadata.subject}* telah diperbaiki!\nPeserta: ${participantIds.length} anggota.`,
            mentions: participantIds
        });

        // Menghapus pesan yang dikutip jika ada
        if (message && message.key && message.key.id) {
            await sock.chatModify(
                { clear: { messages: [{ id: message.key.id, fromMe: message.key.fromMe }] } },
                remoteJid
            );
        }

        await sock.sendMessage(remoteJid, { text: '✔️ Fix chat berhasil!' }, { quoted: message });

    } catch (err) {
        console.error('Terjadi kesalahan saat fix chat:', err);
        await sock.sendMessage(remoteJid, { text: '❌ Gagal memperbaiki chat!' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['fixchat'],
    OnlyPremium: false,
    OnlyOwner: false,
};