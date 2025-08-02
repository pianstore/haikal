// Edit Subject: Mengganti Judul Grup

const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;
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

        // Validasi input
        if (!content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} judul baru*_`
                },
                { quoted: message }
            );
        }

        await sock.groupUpdateSubject(remoteJid, content.trim());

        await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Nama grup berhasil diganti!_`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in edit subject command:", error);
        await sock.sendMessage(
            remoteJid,
            {
                text: '⚠️ Terjadi kesalahan saat mencoba mengganti nama grup. Pastikan format benar dan Anda memiliki izin.'
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['editsubjek', 'editsubject', 'editsubjeck', 'editjudul'],
    OnlyPremium: false,
    OnlyOwner: false,
};