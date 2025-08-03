const axios = require("axios");

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content ?? isQuoted?.text ?? null;

        if (!text || !text.includes('|')) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_\n\n.iqc jam|batre|pesan\nContoh:\n${prefix + command} 18:00|40|hai hai`
            }, { quoted: message });
            return;
        }

        const [time, battery, ...msg] = text.split('|');
        if (!time || !battery || msg.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `_❌ Format salah!_\n\nGunakan:\n${prefix + command} 18:00|40|pesan`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, {
            react: { text: "⏳", key: message.key }
        });

        const messageText = encodeURIComponent(msg.join('|').trim());
        const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&batteryPercentage=${battery}&carrierName=INDOSAT&messageText=${messageText}&emojiStyle=apple`;

        const response = await axios.get(url, { responseType: 'arraybuffer' });

        await sock.sendMessage(remoteJid, {
            image: response.data
        }, { quoted: message });

    } catch (error) {
        const errorMessage = `❌ Gagal membuat gambar:\n${error.message}`;
        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['iqc'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};