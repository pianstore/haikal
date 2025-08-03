const axios = require("axios");

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, isQuoted, prefix, command, pushName } = messageInfo;

    try {
        const text = content ?? isQuoted?.text ?? null;

        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} halo*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        const ppUser = await sock.profilePictureUrl(sender, 'image')
            .catch(() => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');

        const response = await axios.get(`https://ytdlpyton.nvlgroup.my.id/maker/iqc?text=${encodeURIComponent(text)}&user=${encodeURIComponent(pushName)}&profile_url=${encodeURIComponent(ppUser)}`, {
            responseType: 'arraybuffer'
        });

        await sock.sendMessage(remoteJid, {
            image: response.data,
        }, { quoted: message });

    } catch (error) {
        const errorMessage = `❌ Terjadi kesalahan:\n${error.message}`;
        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['iqc2'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};