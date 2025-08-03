const { reply } = require('@lib/utils');
const axios = require('axios');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const apiKey = 'APIKEY_YUDZXML'; // ganti apikey lu
        const response = await axios.get(`https://api.betabotz.eu.org/api/checkkey?apikey=${apiKey}`);

        const data = response.data;

        if (data?.status === 200 && data?.result) {
            const r = data.result;
            await reply(m, `✅ *api key aktif*

◧ *limit:* ${r.limit}
◧ *masa aktif:* ${r.expired}
◧ *hit hari ini:* ${r.todayHit}
◧ *total hit:* ${r.totalHit}`);
        } else {
            await reply(m, `⛔ *api key tidak valid atau expired.*`);
        }

    } catch (error) {
        await reply(m, `⚠️ *terjadi kesalahan saat memeriksa api key.*\n\npesan error: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['apikey2'],
    OnlyPremium: true,
    OnlyOwner: false
};