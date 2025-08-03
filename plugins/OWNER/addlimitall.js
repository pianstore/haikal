const { findUser, updateUser, addUser } = require('@lib/users');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isGroup, prefix, command } = messageInfo;

    if (!isGroup) {
        return sock.sendMessage(remoteJid, {
            text: `❌ _perintah ini hanya bisa digunakan dalam grup._`
        }, { quoted: message });
    }

    const amount = parseInt(content.trim(), 10);
    if (isNaN(amount) || amount <= 0) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ _masukkan jumlah limit yang valid._\n\n_contoh: *${prefix + command} 10*_`
        }, { quoted: message });
    }

    const metadata = await sock.groupMetadata(remoteJid); // langsung dari socket
    const members = metadata.participants;

    let totalUpdated = 0;

    for (const member of members) {
        const jid = member.id;
        if (jid === sock.user.id) continue; // skip bot sendiri

        const user = await findUser(jid) || await addUser(jid);
        await updateUser(jid, {
            limit: (user.limit || 0) + amount
        });

        totalUpdated++;
    }

    return sock.sendMessage(remoteJid, {
        text: `✅ _berhasil menambahkan *${amount} limit* ke *${totalUpdated} member* grup._`
    }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ['addlimitall'],
    OnlyOwner: true,
    OnlyGroup: true
};