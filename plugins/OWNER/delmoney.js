const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, mentionedJid, isQuoted, prefix, command } = messageInfo;

    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ *${prefix + command} 6285256833258 10* atau reply pesan: *${prefix + command} 10*` },
            { quoted: message }
        );
    }

    const [arg1, arg2] = content.split(' ').map(v => v.trim());
    const quotedJid = isQuoted ? message.message?.extendedTextMessage?.contextInfo?.participant : null;

    const userToAction = quotedJid || determineUser(mentionedJid, false, arg1);
    const rawMoney = quotedJid ? arg1 : arg2;

    if (!userToAction || !rawMoney) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Format salah._\n\n_Contoh: *${prefix + command} 6285256833258 10*_ atau reply pesan dengan: *${prefix + command} 10*` },
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

    const moneyToSubtract = parseInt(rawMoney, 10);
    if (isNaN(moneyToSubtract) || moneyToSubtract <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Jumlah money harus berupa angka positif._` },
            { quoted: message }
        );
    }

    const userData = await findUser(targetJid);
    if (!userData) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Pengguna tidak ditemukan._` },
            { quoted: message }
        );
    }

    const currentMoney = userData.money || 0;
    if (moneyToSubtract > currentMoney) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_Pengguna hanya memiliki ${currentMoney} money. Tidak cukup untuk dikurangi ${moneyToSubtract}_` },
            { quoted: message }
        );
    }

    const newMoney = currentMoney - moneyToSubtract;
    await updateUser(targetJid, { money: newMoney });

    return await sock.sendMessage(
        remoteJid,
        {
            text:
                `✅ Money berhasil *dikurangi* untuk @${targetJid.replace('@s.whatsapp.net', '')}\n\n` +
                `• Dikurangi: *${moneyToSubtract}*\n` +
                `• Sebelumnya: *${currentMoney}*\n` +
                `• Sekarang: *${newMoney}*`,
            mentions: [targetJid]
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ['delmoney'],
    OnlyOwner: true,
    OnlyPremium: false
};