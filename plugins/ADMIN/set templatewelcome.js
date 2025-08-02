const { setTemplateWelcome } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;
    if (!isGroup) return;

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    const isAdmin = participants.some(p => p.id === sender && p.admin);
    const isOwner = OWNER_NUMBERS.includes(sender);

    if (!isAdmin && !isOwner) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Format Penggunaan:*

💬 *Contoh:* 
_${prefix}${command} 2_

_Hanya tersedia *1 sampai 7*_ 
_atau *text*_

_Untuk melihat gambar welcome silakan ketik *.teswelcome*_`;
        return await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
    }

    if (content.trim() === 'text') {
        await setTemplateWelcome(remoteJid, 'text');
        return await sock.sendMessage(remoteJid, { text: `✅ _Template Welcome berhasil disetel ke mode teks_` }, { quoted: message });
    }

    const validNumbers = /^[1-7]$/;
    if (!validNumbers.test(content.trim())) {
        const invalidMessage = `⚠️ _Input tidak valid!_

_Hanya diperbolehkan angka dari *1* sampai *7*._`;
        return await sock.sendMessage(remoteJid, { text: invalidMessage }, { quoted: message });
    }

    await setTemplateWelcome(remoteJid, content.trim());
    return await sock.sendMessage(remoteJid, { text: `✅ _Template Welcome berhasil disetel_` }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["settemplatewelcome", "templatewelcome"],
    OnlyPremium: false,
    OnlyOwner: false,
};