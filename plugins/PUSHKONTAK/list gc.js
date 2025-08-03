const { groupFetchAllParticipating } = require("@lib/cache");

async function formatGrup(sock, index, grup) {
    try {
        const inviteCode = await sock.groupInviteCode(grup.id);
        const groupLink = `https://chat.whatsapp.com/${inviteCode}`;
        return `╭─「 ${index} 」 *${grup.subject}*
│ Anggota : ${grup.participants.length}
│ ID Grup : ${grup.id}
│ Link    : ${groupLink}
╰────────────────────────`;
    } catch (error) {
        return `╭─「 ${index} 」 *${grup.subject}*
│ Anggota : ${grup.participants.length}
│ ID Grup : ${grup.id}
╰────────────────────────`;
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const allGroups = await groupFetchAllParticipating(sock);

        // ID grup yang tidak ingin ditampilkan
        const blacklist = ['120363417350190908@g.us','120363401420049080@g.us','120363415905640329@g.us','120363401720297966@g.us'];

        // Filter grup yang tidak ada dalam blacklist
        const filteredGroups = Object.values(allGroups).filter(
            group => !blacklist.includes(group.id)
        );

        // Urutkan berdasarkan jumlah anggota (descending)
        const sortedGroups = filteredGroups.sort((a, b) => b.participants.length - a.participants.length);

        // Format tampilan grup
        const formattedGroups = await Promise.all(
            sortedGroups.map((group, index) => formatGrup(sock, index + 1, group))
        );

        const totalGroups = sortedGroups.length;
        const responseMessage = `_*Total Grup: ${totalGroups}*_ \n\n${formattedGroups.join('\n\n')}`;

        await sock.sendMessage(
            remoteJid,
            { text: responseMessage },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "_Terjadi kesalahan saat memproses perintah._" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['listgc', 'listgrub', 'listgroub', 'listgrup', 'listgroup'],
    OnlyPremium: false,
    OnlyOwner: true
};