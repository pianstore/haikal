const axios = require('axios');
const config = require('@config');
const { logCustom } = require('@lib/logger');

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} siapa presiden indonesia*_`
            }, { quoted: message });
        }

        // Loading reaction
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Memanggil endpoint DiiOffc
        const { data: res } = await axios.get(`https://api.diioffc.web.id/api/ai/bard?query=${encodeURIComponent(content)}`);

        if (res?.status && res?.result?.message) {
            await sock.sendMessage(remoteJid, { text: res.result.message }, { quoted: message });
        } else {
            await sock.sendMessage(remoteJid, { text: "❌ Tidak ada respons valid dari server." }, { quoted: message });
        }
    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `❌ terjadi kesalahan saat memproses permintaan.`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['ai2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};