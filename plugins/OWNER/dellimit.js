const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, mentionedJid, isQuoted, prefix, command } = messageInfo;

    // Validasi input kosong
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ *${prefix + command} 6285256833258 10* atau reply: *${prefix + command} 10*` },
            { quoted: message }
        );
    }

    const [arg1, arg2] = content.split(' ').map(item => item.trim());

    // Ambil JID dari reply jika ada
    const quotedJid = isQuoted ? message.message?.extendedTextMessage?.contextInfo?.participant : null;

    // Tentukan target pengguna
    const userToAction = quotedJid || determineUser(mentionedJid, false, arg1);
    const rawLimit = quotedJid ? arg1 : arg2;

    if (!userToAction || !rawLimit) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Format salah._\n\n_Contoh: *${prefix + command} 6285256833258 10*_ atau reply dengan: *${prefix + command} 10*` },
            { quoted: message }
        );
    }

    const targetJid = userToAction.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    if (!/^\d{10,15}@s\.whatsapp\.net$/.test(targetJid)) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Nomor tidak valid._` },
            { quoted: message }
        );
    }

    const limitToReduce = parseInt(rawLimit, 10);
    if (isNaN(limitToReduce) || limitToReduce <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Jumlah limit harus berupa angka positif._` },
            { quoted: message }
        );
    }

    const userData = await findUser(targetJid);
    if (!userData) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Pengguna dengan nomor tersebut tidak ditemukan._` },
            { quoted: message }
        );
    }

    const currentLimit = userData.limit || 0;
    const newLimit = Math.max(0, currentLimit - limitToReduce);

    await updateUser(targetJid, { limit: newLimit });

    return await sock.sendMessage(
        remoteJid,
        {
            text:
                `✅ Limit berhasil *dikurangi* untuk @${targetJid.replace('@s.whatsapp.net', '')}\n\n` +
                `• Dikurangi: *${limitToReduce}*\n` +
                `• Sebelumnya: *${currentLimit}*\n` +
                `• Sekarang: *${newLimit}*`,
            mentions: [targetJid]
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ['dellimit'],
    OnlyOwner: true,
    OnlyPremium: false
};