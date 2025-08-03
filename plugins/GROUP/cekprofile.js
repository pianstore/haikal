const { findUser, isOwner, isPremiumUser } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText, mentionedJid, quotedMessage, sender, command, prefix } = messageInfo;

    let target;

    // Prioritas: Mention > Nomor > Reply
    if (mentionedJid?.length) {
        target = mentionedJid[0];
    } else if (fullText.replace(command, '').trim().match(/^\d+$/)) {
        target = fullText.replace(command, '').trim() + "@s.whatsapp.net";
    } else if (quotedMessage?.sender) {
        target = quotedMessage.sender;
    } else {
        return sock.sendMessage(remoteJid, {
            text: `_⚠️ Format Penggunaan:_\n\n*${prefix + command} @tag/reply pesan*`
        }, { quoted: message });
    }

    const dataUsers = await findUser(target);
    if (!dataUsers) {
        return sock.sendMessage(remoteJid, {
            text: "_❌ Pengguna tidak ditemukan dalam database._"
        }, { quoted: message });
    }

    const role = await isOwner(target)
        ? 'ᴏᴡɴᴇʀ'
        : await isPremiumUser(target)
        ? 'ᴘʀᴇᴍɪᴜᴍ'
        : dataUsers.role;

    const teks = `
╭─────────────────────╮
│                 ᴜꜱᴇʀ ᴘʀᴏꜰɪʟᴇ
├─────────────────────┤
│ ɴᴀᴍᴇ  : @${target.split('@')[0]}  
│ ʟᴇᴠᴇʟ : ${dataUsers.level || 0}  
│ ʟɪᴍɪᴛ : ${dataUsers.limit || 0}  
│ ᴍᴏɴᴇʏ : ${dataUsers.money || 0}  
│ ʀᴏʟᴇ  : ${role}  
╰─────────────────────╯`;

    await sendMessageWithMention(sock, remoteJid, teks, message);
}

module.exports = {
    handle,
    Commands: ['cekprofile'],
    OnlyPremium: false,
    OnlyOwner: false
};