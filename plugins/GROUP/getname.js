const { findUser } = require('@lib/users');
const { getName } = require('@lib/cache');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, mentionedJid, content, isQuoted } = messageInfo;

    try {
        let target;

        // Tampilkan reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Tentukan target JID
        if (isQuoted) {
            target = isQuoted.sender;
        } else if (content && /^[0-9]{10,15}$/.test(content)) {
            target = `${content}@s.whatsapp.net`;
        } else {
            target = (mentionedJid && mentionedJid.length > 0) ? mentionedJid[0] : sender;
        }

        // 1. Cek nama dari database user
        const user = await findUser(target);
        if (user?.name) {
            return await sock.sendMessage(
                remoteJid,
                { text: `${user.name}` },
                { quoted: message }
            );
        }

        // 2. Jika tidak ada, ambil dari WhatsApp
        const waName = await getName(sock, target);

        await sock.sendMessage(
            remoteJid,
            { text: `${waName}` },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error saat mengambil nama:', error.message);

        await sock.sendMessage(
            remoteJid,
            {
                text: '⚠️ _terjadi kesalahan saat menampilkan nama pengguna._',
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['getname'],
    OnlyPremium : false,
    OnlyOwner   : false
};