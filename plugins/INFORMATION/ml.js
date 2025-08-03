const axios = require('axios');
const config = require('@config');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_masukkan id game_\n\n${prefix + command} 102337061 1001` },
                { quoted: message }
            );
        }

        const [user_id, zone_id] = trimmedContent.split(' ');

        if (!user_id || !zone_id) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _format salah. gunakan:_\n\n${prefix + command} <user_id> <zone_id>` },
                { quoted: message }
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        // Gunakan endpoint dari NVL Group
        const response = await axios.get(`https://ytdlpyton.nvlgroup.my.id/ml/stalk?user_id=${user_id}&zone_id=${zone_id}`);
        const data = response?.data;

        if (data?.success || data?.berhasil) {
            const { username, region } = data;

            const resultText = `🎮 | *MOBILE LEGEND*

◧ User ID : ${user_id}
◧ Zone ID : ${zone_id}
◧ Username : ${decodeURIComponent(username) || 'Tidak diketahui'}
◧ Region   : ${region || 'Tidak tersedia'}`;

            await sock.sendMessage(remoteJid, { text: resultText }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            await sock.sendMessage(remoteJid, { text: 'Maaf, data tidak ditemukan.' }, { quoted: message });
        }

    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        await sock.sendMessage(
            remoteJid,
            { text: `Maaf, terjadi kesalahan saat memproses permintaan.\n\nDetail: ${error.message || error}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['ml', 'mlcek'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1
};