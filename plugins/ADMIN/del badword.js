const { addBadword, updateBadword, findBadword } = require("@lib/badword");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, command, fullText } = messageInfo;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        let dataGrub = await ensureGroupData(remoteJid);

        const args = fullText.trim().split(" ").slice(1);
        let responseMessage = await removeBadwordFromList(remoteJid, dataGrub, args);

        await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
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

async function removeBadwordFromList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return "⚠️ _Mohon berikan kata yang ingin dihapus._";
    }

    const deletedWords = [];
    dataGrub.listBadword = dataGrub.listBadword.filter(word => {
        const lowerCaseWord = word.toLowerCase();
        const lowerCaseWords = words.map(w => w.toLowerCase());

        if (lowerCaseWords.includes(lowerCaseWord)) {
            deletedWords.push(word);
            return false;
        }
        return true;
    });

    if (deletedWords.length === 0) {
        return "⚠️ _Tidak ada kata yang ditemukan di dalam daftar badword._";
    }

    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
    return `✅ _Kata berikut berhasil dihapus dari daftar badword:_ ${deletedWords.join(", ")}`;
}

async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands: ["delbadword"],
    OnlyPremium: false,
    OnlyOwner: false
};