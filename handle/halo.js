const axios = require('axios');

async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message, fullText } = messageInfo;

    if (!message || !fullText || !isGroup) return;

    // Hindari memproses pesan dari bot sendiri
    if (message.key?.fromMe) return;

    const normalizedText = fullText.toLowerCase().trim();

    // Kata sapaan yang dikenali
    const greetings = ['halo', 'hay', 'hai', 'hy', 'hi'];

    if (greetings.includes(normalizedText)) {
        try {
            const { data: audioBuffer } = await axios.get('https://files.catbox.moe/2qnh9s.mp3', {
                responseType: 'arraybuffer'
            });

            await sock.sendMessage(remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: message });
        } catch (err) {
            console.error("Gagal mengunduh atau mengirim audio sapaan:", err.message);
        }
    }
}

module.exports = {
    name: "AutoGreetingReply",
    priority: 1,
    process,
};