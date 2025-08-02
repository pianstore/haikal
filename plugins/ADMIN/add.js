const mess  = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

const FITUR = false; // jadikan true jika ingin maksa di aktifkan

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;

    if (!FITUR) {
        await sock.sendMessage(remoteJid, {
            text: `_⚠️Saat ini fitur sedang di matikan, karena resiko menyebabkan ban_`,
        }, { quoted: message });
        return;
    }

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

    const nomor = content.replace(/[^0-9]/g, "");
    const whatsappJid = `${nomor}@s.whatsapp.net`;

    if (!/^\d{10,15}$/.test(nomor)) {
        await sock.sendMessage(remoteJid, {
            text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 6285256833258*_`,
        }, { quoted: message });
        return;
    }

    try {
        const response = await sock.groupParticipantsUpdate(remoteJid, [whatsappJid], "add");
        const status = response[0]?.status;

        if (status == 409) {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ _Nomor *${nomor}* sudah berada di grup._`,
            }, { quoted: message });
        } else if (status == 403) {
            await sock.sendMessage(remoteJid, {
                text: `❌ _Tidak dapat menambahkan nomor *${nomor}* karena pengaturan privasi pengguna._`,
            }, { quoted: message });
        } else {
            await sock.sendMessage(remoteJid, {
                text: `✅ _Berhasil menambahkan anggota *${nomor}* ke grup._`,
            }, { quoted: message });
        }
    } catch (error) {
        await sock.sendMessage(remoteJid, {
            text: `❌ _Tidak dapat menambahkan nomor_ *${nomor}* _ke grub._`,
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['add'],
    OnlyPremium: false,
    OnlyOwner: false
};