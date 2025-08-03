const { reply } = require('@lib/utils');
const axios = require('axios');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    try {
        
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        
        const response = await axios.get("https://elrayyxml.vercel.app/api/status");
        const data = response?.data;

        if (data?.status && data?.result) {
            const { status, totalrequest, totalfitur, runtime, domain } = data.result;

            await reply(m, `🌐 *Status API ElrayyXml*

◧ _Status Server:_ *${status}*
◧ _Total Request:_ *${totalrequest}*
◧ _Total Fitur:_ *${totalfitur}*
◧ _Uptime:_ *${runtime}*
◧ _Domain:_ *${domain}*`);
        } else {
            await reply(m, `❌ _Gagal mengambil status API._`);
        }
    } catch (error) {
        await sock.sendMessage(remoteJid, { text: error.message }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['status'],
    OnlyPremium : false,
    OnlyOwner   : false
};