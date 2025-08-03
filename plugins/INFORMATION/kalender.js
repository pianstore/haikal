const axios = require('axios');
const { logCustom } = require('../../lib/logger'); // Penyesuaian path lib.logger
const mess = require('../../mess'); // Penyesuaian path mess

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, command } = messageInfo;
    const url = 'https://fgsi1-restapi.hf.space/api/maker/calendar';

    try {
        // Loading reaction
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Ambil gambar kalender
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Kirimkan gambar kalender
        await sock.sendMessage(remoteJid, {
            image: imageBuffer,
            caption: mess.general.success + '\n\n*Berikut Kalender Hari Ini*'
        }, { quoted: message });

    } catch (error) {
        logCustom('error', content, `ERROR-COMMAND-KALENDER-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `${mess.general.fail}\n\n${error}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['kalender', 'ckalender'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 0
};