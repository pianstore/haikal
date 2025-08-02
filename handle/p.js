const axios = require('axios');

async function process(sock, messageInfo) {
    const { remoteJid, pushName, isGroup, message, fullText, sender } = messageInfo;

    if (!message || !fullText || !isGroup) return;

    // Hindari memproses pesan dari bot sendiri
    if (message.key?.fromMe) return;

    // Normalisasi teks (hapus spasi dan huruf kapital)
    const normalizedText = fullText.toLowerCase().trim();

    // Balas hanya jika isi pesan benar-benar "p" (bukan bagian dari kata lain)
    if (normalizedText === 'p') {
        try {
            const { data: audioBuffer } = await axios.get('https://files.catbox.moe/733ht4.mp3', {
                responseType: 'arraybuffer'
            });

            await sock.sendMessage(remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: message });

        } catch (err) {
            console.error("Gagal mengunduh atau mengirim audio:", err.message);
        }

        return;
    }
}

module.exports = {
    name: "AutoPReply",
    priority: 1,
    process,
};