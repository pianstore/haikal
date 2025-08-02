const { setGroupSchedule } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");
const { convertTime, getTimeRemaining } = require('@lib/utils');

// Daftar nomor owner
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
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 23:10*_
        
_Bot akan membuka grup secara otomatis pada jam itu setiap harinya_ \n\n_Untuk menghapus jadwal, ketik:_ _*.setopengc off*_`;
        return await sock.sendMessage(remoteJid, { text: MSG }, { quoted: message });
    }

    if (content.trim() === 'off') {
        await setGroupSchedule(sock, remoteJid, 'off', 'openTime');
        return await sock.sendMessage(
            remoteJid,
            { text: `✅ _Open grup otomatis berhasil dinonaktifkan_` },
            { quoted: message }
        );
    }

    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(content.trim())) {
        const MSG = `_⚠️ Format jam tidak valid!_\n\n_Pastikan format jam adalah HH:mm (contoh: 23:10)_`;
        return await sock.sendMessage(remoteJid, { text: MSG }, { quoted: message });
    }

    await setGroupSchedule(sock, remoteJid, content.trim(), 'openTime');

    const serverTime = convertTime(content.trim());
    const { hours, minutes } = getTimeRemaining(serverTime);

    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Grup akan otomatis dibuka pada pukul *${content.trim()}* WIB_\n⏰ _Sekitar ${hours} jam ${minutes} menit lagi_\n\n_Pastikan bot sudah menjadi admin untuk menjalankan perintah ini_`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ["setopengc"],
    OnlyPremium: false,
    OnlyOwner: false,
};