const mess = require("@mess");
const config = require("@config");
const { getActiveUsers } = require("@lib/users");
const { sendMessageWithMention } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

const TOTAL_HARI_SIDER = 30;
const DELAY_KICK = 3000;
let inProccess = false;

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if (inProccess) {
            await sendMessageWithMention(sock, remoteJid, `_Proses pembersihan member sider sedang berlangsung, silakan tunggu hingga selesai_`, message);
            return;
        }

        const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

        const memberList = participants
            .filter(p => !listNotSider.some(active => active.id === p.id))
            .map(p => p.id);

        const countSider = memberList.length;
        const totalMember = participants.length;

        if (countSider === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '📋 _Tidak ada member sider di grup ini._' },
                { quoted: message }
            );
        }

        const input = content.toLowerCase().trim();

        if (input === 'all' || (!isNaN(input) && Number(input) > 0)) {
            const jumlahKick = input === 'all' ? memberList.length : Math.min(Number(input), memberList.length);

            await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
            inProccess = true;

            let successCount = 0;
            let failedCount = 0;

            for (const [index, member] of memberList.entries()) {
                if (index >= jumlahKick) break;
                if (member === `${config.phone_number_bot}@s.whatsapp.net`) continue;

                await new Promise(resolve => setTimeout(resolve, DELAY_KICK));

                try {
                    await sock.groupParticipantsUpdate(remoteJid, [member], 'remove');
                    successCount++;
                } catch (error) {
                    failedCount++;
                }
            }

            inProccess = false;

            const resultMsg = successCount === jumlahKick
                ? `_Berhasil mengeluarkan ${successCount} member sider_`
                : `_Berhasil mengeluarkan ${successCount} dari ${jumlahKick} member sider_`;

            await sendMessageWithMention(sock, remoteJid, resultMsg, message);
            return;
        }

        await sendMessageWithMention(sock, remoteJid,
            `_Total Sider *${countSider}* dari ${totalMember}_\n\n_Untuk melanjutkan kick member sider, ketik:_\n• *.kicksider all* — untuk keluarkan semua\n• *.kicksider <jumlah>* — untuk keluarkan sebagian\n\nContoh: *.kicksider 5*`,
            message
        );

    } catch (error) {
        console.error("Error handling kick sider command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Terjadi kesalahan saat memproses permintaan Anda." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["kicksider"],
    OnlyPremium: false,
    OnlyOwner: false
};