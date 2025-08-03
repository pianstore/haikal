const { sendMessageWithMention } = require('@lib/utils');
const { readUsers } = require("@lib/users");
const { getGroupMetadata } = require("@lib/cache");
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin);

        const dataUsers = await readUsers();

        // Tampilkan hanya user yang memiliki status special
        const specialUsers = Object.entries(dataUsers)
            .filter(([id, userData]) => userData.special);

        if (specialUsers.length === 0) {
            await sock.sendMessage(remoteJid, { text: '⚠️ Tidak ada special user terdaftar.' }, { quoted: message });
            return;
        }

        const listText = specialUsers
            .map(([id, userData]) =>
                `┣ ⌬ @${id.split('@')[0]} 🤍 `
            )
            .join('\n');

        const resultText = `┏━『 *SPECIAAL USERR* 』\n┣\n${listText}\n┗━━━━━━━━━━━━━━━`;

        await sendMessageWithMention(sock, remoteJid, resultText, message);

    } catch (error) {
        console.error("Error in specialuser:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Terjadi kesalahan saat menampilkan special user."
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['🤍'],
    OnlyPremium: false,
    OnlyOwner: false
};