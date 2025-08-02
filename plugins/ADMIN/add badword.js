const { addBadword, updateBadword, findBadword } = require("@lib/badword");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, prefix, command, content, fullText } = messageInfo;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if (!content || !content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} tolol*_` },
                { quoted: message }
            );
        }

        const args = fullText.trim().split(" ").slice(1);
        const dataGrub = await ensureGroupData(remoteJid);
        const responseMessage = await addBadwordToList(remoteJid, dataGrub, args);

        await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        console.error(error);
        await sendResponse(sock, remoteJid, "❌ Terjadi kesalahan saat memproses perintah.", message);
    }
}

async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

async function addBadwordToList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return "⚠️ _Mohon berikan kata yang ingin ditambahkan. Contoh: .addbadword tolol_";
    }

    const newWords = words.filter(word => !dataGrub.listBadword.includes(word));
    if (newWords.length === 0) {
        return "⚠️ _Semua kata sudah ada dalam daftar badword._";
    }

    dataGrub.listBadword.push(...newWords);
    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
    return `✅ _Berhasil menambahkan kata:_ ${newWords.join(", ")}`;
}

async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands: ["addbadword"],
    OnlyPremium: false,
    OnlyOwner: false
};