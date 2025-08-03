const { reply } = require('@lib/utils');
const axios = require('axios');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    try {
        // Kirim reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Panggil API BetaBotz
        const apiUrl = `${config.apikey.botz}/api/checkkey?apikey=${config.apikey.key}`;
        const response = await axios.get(apiUrl);

        const result = response.data;
        if (result && result.status === 200 && result.result) {
            const data = result.result;
            const limit = data.limit;
            const expiredText = data.expired; // String waktu kadaluarsa

            await reply(m,  `✅ _Apikey Aktif_

◧ _Masa Aktif Hingga :_ *${expiredText}*
◧ _Limit :_ *${limit}*`);
        } else {
            await reply(m, `⛔ _Apikey Tidak Terdaftar / Expired_`);
        }

    } catch (error) {
        await reply(m, `⚠️ _Terjadi kesalahan saat memeriksa API key._\nPesan error: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands    : ['apikey3'],
    OnlyPremium : true,
    OnlyOwner   : false
};