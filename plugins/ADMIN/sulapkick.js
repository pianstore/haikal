const mess = require('@mess');
const config = require("@config");
const { getGroupMetadata } = require("@lib/cache");
const { determineUser } = require('@lib/utils');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, mentionedJid, isQuoted, content, prefix, command } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        if (`${config.phone_number_bot}@s.whatsapp.net` === userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Tidak dapat kick nomor sendiri_` },
                { quoted: message }
            );
        }

        await sock.sendMessage(remoteJid, { text: '🎩 Perhatikan baik-baik...' }, { quoted: message });
        await sleep(2000);
        await sock.sendMessage(remoteJid, { text: '🪄 Abra...' }, { quoted: message });
        await sleep(1000);
        await sock.sendMessage(remoteJid, { text: '✨ Kadabra...' }, { quoted: message });
        await sleep(1000);
        await sock.sendMessage(remoteJid, { text: '🔮 Sim salabim...' }, { quoted: message });
        await sleep(2000);
        await sock.sendMessage(remoteJid, { text: '💨 Dan sekarang... kamu akan *menghilang* dari grup ini!' }, { quoted: message });
        await sleep(2000);

        const kickResult = await sock.groupParticipantsUpdate(remoteJid, [userToAction], 'remove');
        if (kickResult && mess.action.user_kick) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.action.user_kick },
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('Error handling kick:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba mengeluarkan pengguna. Pastikan bot memiliki izin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['sulap'],
    OnlyPremium : true,
    OnlyOwner   : false,
};