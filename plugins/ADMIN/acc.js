const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return;

    try {
        // Dapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, { text: `🚀 *Mengambil data peserta yang ingin bergabung ke grup...*` }, { quoted: message });

        const request = await sock.groupRequestParticipantsList(remoteJid);
        if (request.length === 0) {
            return await sock.sendMessage(remoteJid, { text: `🤷‍♂️ *Tidak ada orang yang meminta bergabung ke grup ini.*` }, { quoted: message });
        }

        for (const member of request) {
            console.log(`📋 Permintaan diterima:`, member.jid);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.groupRequestParticipantsUpdate(remoteJid, [member.jid], "approve");
        }

        await sock.sendMessage(remoteJid, { text: `✅ *Selesai! Semua permintaan peserta telah disetujui.*` }, { quoted: message });

    } catch (error) {
        console.error("Error in acc command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ bot belum menjadi admin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['acc'],
    OnlyPremium : false,
    OnlyOwner   : false,
};