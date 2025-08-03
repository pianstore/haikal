const { findUser } = require("@lib/users");
const { isOwner, isPremiumUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, pushName } = messageInfo;

    // Ambil data pengguna
    const dataUsers = await findUser(sender);
    if (!dataUsers) return;

    const role = await isOwner(sender)
        ? 'ᴏᴡɴᴇʀ'
        : await isPremiumUser(sender)
        ? 'ᴘʀᴇᴍɪᴜᴍ'
        : dataUsers.role || 'ᴜꜱᴇʀ';

    let teks = `
╭─────────────────────╮
│                 ᴜꜱᴇʀ ᴘʀᴏꜰɪʟᴇ
├─────────────────────┤
│ ɴᴀᴍᴇ  : ${pushName}  
│ ʟᴇᴠᴇʟ : ${dataUsers.level || 0}  
│ ʟɪᴍɪᴛ : ${dataUsers.limit || 0}  
│ ᴍᴏɴᴇʏ : ${dataUsers.money || 0}  
│ ʀᴏʟᴇ  : ${role}  
╰─────────────────────╯
`;

    await sock.sendMessage(
        remoteJid,
        { text: teks.trim() },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['me2', 'limit2'],
    OnlyPremium : false,
    OnlyOwner   : false
};