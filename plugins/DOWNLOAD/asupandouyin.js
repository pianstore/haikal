const { reply } = require('@lib/utils');

const axios = require('axios');

const mess = require('@mess');

const API_KEY = 'APIKEY_YUDZXML';

async function handle(sock, messageInfo) {

    const { m, remoteJid, message } = messageInfo;

    try {

        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const response = await axios.get(`https://api.betabotz.eu.org/api/asupan/douyin?apikey=${API_KEY}`, {

            responseType: 'arraybuffer'

        });

        const videoBuffer = Buffer.from(response.data);

        await sock.sendMessage(remoteJid, {

            video: videoBuffer,

            mimetype: 'video/mp4',

            caption: `_🎬 Asupan Douyin datang membawa energi baru!_`

        }, { quoted: message });

    } catch (error) {

        console.error("DOUYIN ERROR:", error);

        await reply(m, `_Terjadi kesalahan saat memuat video asupan._\n\n🧾 *Detail:* ${error.message}`);

    }

}

module.exports = {

    handle,

    Commands: ['asupandouyin'],

    OnlyPremium: false,

    OnlyOwner: false,

    limitDeduction: 1

};