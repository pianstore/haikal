const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    const pluginsDir = path.join(__dirname, '../plugins');

    function countJsFiles(dir) {
        let count = 0;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                count += countJsFiles(filePath);
            } else if (file.endsWith('.js')) {
                count++;
            }
        });
        return count;
    }

    try {
        const total = countJsFiles(pluginsDir);
        const text = `📦 *total fitur:* ${total}`;
        await sock.sendMessage(remoteJid, { text }, { quoted: message });
    } catch (err) {
        console.error('gagal baca folder plugins:', err);
        await sock.sendMessage(remoteJid, { text: '❌ gagal membaca jumlah plugin.' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['totalfitur'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 0
};