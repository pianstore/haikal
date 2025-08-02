const axios = require('axios');

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message, fullText } = messageInfo;

    if (!message || !fullText || !isGroup) return;
    if (message.key?.fromMe) return;

    const normalizedText = fullText.trim();

    try {
        if (normalizedText.includes('📝')) {
            await sock.sendMessage(remoteJid, {
                text: "salam kenal",
            }, { quoted: message });
        }

    } catch (err) {
        console.error("Gagal memproses pesan:", err.message);
    }
}

module.exports = {
    name: "AutoGreetingReply",
    priority: 1,
    process,
};