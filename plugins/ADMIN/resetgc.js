const { getGroupMetadata } = require("@lib/cache");
const { deleteBadword } = require("@lib/badword");
const { deleteGroup } = require("@lib/group");
const { deleteAllListInGroup } = require("@lib/list");
const fs = require('fs');
const path = require('path');
const mess = require("@mess");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

// Path database
const absenJson = path.join(process.cwd(), 'database', 'additional', 'absen.json');
const groupParticipantJson = path.join(process.cwd(), 'database', 'additional', 'group participant.json');
const totalChatJson = path.join(process.cwd(), 'database', 'additional', 'totalchat.json');
const badwordJson = path.join(process.cwd(), 'database','badword.json');
const slrJson = path.join(process.cwd(), 'database','slr.json');
const listJson = path.join(process.cwd(), 'database','list.json');

// Fungsi cek admin
async function isAdmin(sock, remoteJid, sender) {
    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        return participants.some(p => p.id === sender && p.admin);
    } catch {
        return false;
    }
}

// Fungsi utama
async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return;

    try {
        const isSenderAdmin = await isAdmin(sock, remoteJid, sender);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isSenderAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        await resetGroupSettings(remoteJid);
        await sock.sendMessage(remoteJid, { text: "✅ Pengaturan grup ini telah berhasil direset." }, { quoted: message });

    } catch (error) {
        console.error("Error in resetgc command:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mereset pengaturan grup.' },
            { quoted: message }
        );
    }
}

// Fungsi reset isi file JSON & database
async function resetGroupSettings(remoteJid) {
    try {
        const absenData = JSON.parse(fs.readFileSync(absenJson, 'utf8'));
        const groupParticipantData = JSON.parse(fs.readFileSync(groupParticipantJson, 'utf8'));
        const totalChatData = JSON.parse(fs.readFileSync(totalChatJson, 'utf8'));
        const badwordData = JSON.parse(fs.readFileSync(badwordJson, 'utf8'));
        const slrData = JSON.parse(fs.readFileSync(slrJson, 'utf8'));
        const listData = JSON.parse(fs.readFileSync(listJson, 'utf8'));

        const removeKey = (data, filePath) => {
            if (data[remoteJid]) {
                delete data[remoteJid];
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            }
        };

        removeKey(absenData, absenJson);
        removeKey(groupParticipantData, groupParticipantJson);
        removeKey(totalChatData, totalChatJson);
        removeKey(badwordData, badwordJson);
        removeKey(slrData, slrJson);
        removeKey(listData, listJson);

        await deleteGroup(remoteJid);
        await deleteBadword(remoteJid);
        await deleteAllListInGroup(remoteJid);

    } catch (error) {
        throw new Error("Gagal mereset pengaturan grup.");
    }
}

module.exports = {
    handle,
    Commands: ['resetgc'],
    OnlyPremium: false,
    OnlyOwner: false,
};