const { sendMessageWithMention } = require('@lib/utils');
const { readUsers } = require("@lib/users");
const { getGroupMetadata } = require("@lib/cache");
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    try {
        // Ambil metadata grup dan peserta
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Ambil semua ID anggota grup
        const groupMemberIds = participants.map(p => p.id);

        // Baca semua data pengguna
        const dataUsers = await readUsers();

        // Filter hanya yang ada di grup
        const filteredUsers = Object.entries(dataUsers).filter(
            ([id]) => groupMemberIds.includes(id)
        );

        // Urutkan berdasarkan money terbanyak dan ambil 10 teratas
        const topUsers = filteredUsers
            .sort(([, a], [, b]) => b.money - a.money)
            .slice(0, 10);

        if (topUsers.length === 0) {
            return await sock.sendMessage(remoteJid, { text: '❌ Tidak ada data member dengan uang di grup ini.' }, { quoted: message });
        }

        // Format output
        const memberList = topUsers.map(
            ([id, userData], index) =>
                `┣ ⌬ @${id.split('@')[0]} - 💰 Money: ${userData.money}`
        ).join('\n');

        const textNotif = `┏━『 *TOP 10 MEMBER GRUP* 』\n┣\n${memberList}\n┗━━━━━━━━━━━━━━━`;

        // Kirim dengan mention
        await sendMessageWithMention(sock, remoteJid, textNotif, message);
    } catch (error) {
        console.error("Error in handle:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Terjadi kesalahan saat menampilkan top 10 member." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['top2'],
    OnlyPremium : false,
    OnlyOwner   : false
};