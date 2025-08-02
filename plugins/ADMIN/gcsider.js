const { sendMessageWithMention } = require('@lib/utils');
const mess = require('@mess');
const { getActiveUsers } = require("@lib/users");
const { getGroupMetadata } = require("@lib/cache");

const TOTAL_HARI_SIDER = 30; // Total hari tidak aktif maksimum

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const { participants } = groupMetadata;
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

        const siders = participants
            .filter(p => !listNotSider.some(active => active.id === p.id));

        if (siders.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '📋 _Tidak ada member sider di grup ini._' },
                { quoted: message }
            );
        }

        const memberList = siders
            .map(p => `◧ @${p.id.split('@')[0]}`)
            .join('\n');

        const teks_sider = `_*${siders.length} Dari ${participants.length}* Anggota Grup ${groupMetadata.subject} Adalah Sider_
        
_*Dengan Alasan :*_
➊ _Tidak Aktif Selama lebih dari ${TOTAL_HARI_SIDER} hari_
➋ _Join Tapi Tidak Pernah Nimbrung_

_Harap Aktif Di Grup Karena Akan Ada Pembersihan Member Setiap Saat_

_*List Member Sider*_
${memberList}`;

        await sendMessageWithMention(sock, remoteJid, teks_sider, message);

    } catch (error) {
        console.error('Error handling gcsider:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat menampilkan semua anggota grup.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['gcsider'],
    OnlyPremium: false,
    OnlyOwner: false,
};