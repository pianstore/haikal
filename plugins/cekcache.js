const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    const tmpPath = path.join(__dirname, '../abc');

    try {
        const files = fs.readdirSync(tmpPath);
        const mp3Files = files.filter(file => file.endsWith('.mp3'));

        const total = mp3Files.length;
        const list = mp3Files
            .map((f, i) => `${i + 1}. ${f}`)
            .slice(0, 20) // tampilkan hanya 20 pertama agar tidak terlalu panjang
            .join('\n');

        const text = `📦 *jumlah file cache audio:* ${total}\n\n🗂 *daftar file MP3:*\n${list || 'tidak ada file.'}`;

        await sock.sendMessage(remoteJid, { text }, { quoted: message });

    } catch (err) {
        console.error('Gagal baca folder abc:', err);
        await sock.sendMessage(remoteJid, { text: '❌ gagal membaca isi folder cache.' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['listabc'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 0
};