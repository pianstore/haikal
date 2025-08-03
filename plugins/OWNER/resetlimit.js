const { readUsers, saveUsers } = require('@lib/users');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    if (!content.trim().toLowerCase().endsWith('-y')) {
        await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Perintah ini akan mengatur ulang limit semua user._\n\nKetik *${prefix + command} -y* untuk melanjutkan.`,
            },
            { quoted: message }
        );
        return;
    }

    try {
        const users = await readUsers();

        for (const id in users) {
            users[id].limit = 0;
        }

        await saveUsers(); // simpan ke file

        await sock.sendMessage(
            remoteJid,
            { text: '✅ _Limit semua user telah direset menjadi 0._' },
            { quoted: message }
        );
    } catch (err) {
        console.error('Error resetting user limits:', err);
        await sock.sendMessage(
            remoteJid,
            { text: '_❌ Terjadi kesalahan saat mereset limit pengguna._' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['resetlimit'],
    OnlyPremium: false,
    OnlyOwner: true,
};