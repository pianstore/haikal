const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    // Validasi input kosong
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 6285256833258 10*_ atau reply pesan: _*${prefix + command} 10*_` },
            { quoted: message }
        );
    }

    // Pisahkan input menjadi nomor/jumlah limit atau hanya jumlah limit (saat reply)
    const [arg1, arg2] = content.split(' ').map(item => item.trim());
    
    // Coba ambil JID dari reply
    const quotedJid = isQuoted ? message.message?.extendedTextMessage?.contextInfo?.participant : null;

    // Tentukan user: reply > mention > nomor
    const userToAction = quotedJid || determineUser(mentionedJid, false, arg1);
    const rawLimit = quotedJid ? arg1 : arg2;

    // Validasi user
    if (!userToAction) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Tidak bisa menentukan pengguna. Gunakan reply, mention, atau nomor._` },
            { quoted: message }
        );
    }

    // Validasi limit
    if (!rawLimit) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Masukkan jumlah limit yang ingin ditambahkan._\n\n_Contoh: *${prefix + command} 6285256833258 10*_ atau _reply pesan + ${prefix + command} 10_` },
            { quoted: message }
        );
    }

    const senderAdd = userToAction.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    if (!/^\d{10,15}@s\.whatsapp\.net$/.test(senderAdd)) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Nomor tidak valid. Pastikan formatnya benar._` },
            { quoted: message }
        );
    }

    const limitToAdd = parseInt(rawLimit, 10);
    if (isNaN(limitToAdd) || limitToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Jumlah limit harus berupa angka positif._` },
            { quoted: message }
        );
    }

    const dataUsers = await findUser(senderAdd);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Pengguna dengan nomor tersebut tidak ditemukan._` },
            { quoted: message }
        );
    }

    await updateUser(senderAdd, {
        limit: (dataUsers.limit || 0) + limitToAdd,
    });

    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Limit berhasil ditambah sebesar ${limitToAdd} untuk pengguna ${senderAdd.replace('@s.whatsapp.net', '')}_` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addlimit'],
    OnlyPremium : false,
    OnlyOwner   : true
};