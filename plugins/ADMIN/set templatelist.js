const { setTemplateList } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    if (!isGroup) return;

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Format Penggunaan:*

💬 *Contoh:* 
_${prefix}${command} 1_

_Hanya tersedia *1 sampai 9*_`;
        return await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
    }

    const validNumbers = /^[1-9]$/;
    if (!validNumbers.test(content.trim())) {
        const invalidMessage = `⚠️ _Input tidak valid!_

_Hanya diperbolehkan angka dari *1* sampai *9*._`;
        return await sock.sendMessage(remoteJid, { text: invalidMessage }, { quoted: message });
    }

    await setTemplateList(remoteJid, content.trim());

    const successMessage = `✅ _Template List Berhasil Diatur_

_Ketik *.list* untuk melihat daftar list_`;
    return await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["settemplatelist", "templatelist"],
    OnlyPremium: false,
    OnlyOwner: false,
};