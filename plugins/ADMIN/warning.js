const batasPeringatan = 3;

const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention, determineUser } = require('@lib/utils');

// Warning list disimpan di memori (RAM)
const warningList = {};

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command, mentionedJid, isQuoted } = messageInfo;

    if (!isGroup) return;

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(p => p.id === sender && p.admin);

    // Debug internal RAM warning list
    if (command === 'debugwarn') {
        console.log('🔧 Debug warningList:', warningList);
        return await sock.sendMessage(remoteJid, {
            text: '📦 Debug log dikirim ke console.'
        }, { quoted: message });
    }

    // Menampilkan daftar warning
    if (command === 'listwarning' || command === 'listwarn') {
        let warningText = '⚠️ *Daftar Peringatan:*\n\n';
        let mentions = [];
        let found = false;

        for (const user in warningList) {
            if (warningList[user] > 0) {
                warningText += `👤 @${user.split('@')[0]}: ${warningList[user]}/${batasPeringatan} peringatan\n`;
                mentions.push(user);
                found = true;
            }
        }

        if (!found) warningText = '✅ Tidak ada pengguna yang memiliki peringatan.';

        await sock.sendMessage(remoteJid, {
            text: warningText,
            mentions: mentions
        }, { quoted: message });
        return;
    }

    // Menghapus warning user
    if (command === 'deletewarning' || command === 'delwarning') {
        const userToDelete = determineUser(mentionedJid, isQuoted, content);
        if (!userToDelete) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ *${prefix + command} 628xxxx*`
            }, { quoted: message });
        }

        if (warningList[userToDelete]) {
            delete warningList[userToDelete];
            await sendMessageWithMention(sock, remoteJid, `✅ Peringatan untuk @${userToDelete.split('@')[0]} telah dihapus.`, message);
        } else {
            await sendMessageWithMention(sock, remoteJid, `❌ @${userToDelete.split('@')[0]} tidak memiliki peringatan.`, message);
        }
        return;
    }

    // Jika command warn
    if (command === 'warn' || command === 'warning') {
        const userToWarn = determineUser(mentionedJid, isQuoted, content);
        if (!userToWarn) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ *${prefix + command} 628xxxx*`
            }, { quoted: message });
        }

        const whatsappJid = userToWarn;

        try {
            warningList[whatsappJid] = (warningList[whatsappJid] || 0) + 1;

            if (warningList[whatsappJid] >= batasPeringatan) {
                await sendMessageWithMention(sock, remoteJid,
                    `❌ _@${whatsappJid.split('@')[0]} telah mencapai batas peringatan dan akan dikeluarkan dari grup._`,
                    message
                );
                await sock.groupParticipantsUpdate(remoteJid, [whatsappJid], 'remove');
                delete warningList[whatsappJid];
                return;
            }

            await sendMessageWithMention(sock, remoteJid,
                `⚠️ @${whatsappJid.split('@')[0]} telah diperingati (${warningList[whatsappJid]}/${batasPeringatan})`,
                message
            );

        } catch (error) {
            console.error(error);
            await sendMessageWithMention(sock, remoteJid,
                `❌ _Tidak dapat memberikan warning ke nomor_ @${whatsappJid.split('@')[0]}`,
                message
            );
        }
    }
}

module.exports = {
    handle,
    Commands: ['warn', 'warning', 'listwarning', 'listwarn', 'deletewarning', 'delwarning', 'debugwarn'],
    OnlyPremium: true,
    OnlyOwner: false,
};
