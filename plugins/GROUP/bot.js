const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    // Tidak perlu cek isGroup, agar bisa jalan di grup dan privchat
    const audioPath = path.join(__dirname, '../../database/audio/haikal.mp3');
    const audioBuffer = fs.readFileSync(audioPath);

    await sock.sendMessage(
        remoteJid,
        {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true // true = dikirim sebagai VN (voice note)
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["bot"],
    OnlyPremium : false,
    OnlyOwner   : false
};