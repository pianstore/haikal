const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');

async function createBackup() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.zip`;
    const backupPath = path.join('./', fileName);

    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    // Folder penting
    archive.directory('cache/', 'cache');
    archive.directory('database/', 'database');
    archive.directory('handle/', 'handle');
    archive.directory('lib/', 'lib');
    archive.directory('plugins/', 'plugins');

    // File penting
    archive.file('autoresbot.js', { name: 'autoresbot.js' });
    archive.file('confess.json', { name: 'confess.json' });
    archive.file('config.js', { name: 'config.js' });
    archive.file('developer.txt', { name: 'developer.txt' });
    archive.file('index.js', { name: 'index.js' });
    archive.file('mess.js', { name: 'mess.js' });
    archive.file('package.json', { name: 'package.json' });
    archive.file('package-lock.json', { name: 'package-lock.json' });
    archive.file('README.md', { name: 'README.md' });
    archive.file('strings.js', { name: 'strings.js' });

    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
        archive.finalize();
    });

    return {
        path: backupPath,
        size: `${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`,
        time: now.toLocaleString()
    };
}

async function uploadToCatbox(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('File backup tidak ditemukan.');

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
        throw new Error('Upload ke Catbox gagal: respons tidak valid');
    }

    return response.data;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const backupFile = await createBackup();
        const link = await uploadToCatbox(backupFile.path);

        await sock.sendMessage(remoteJid, {
            text: `✅ _Backup sukses dan diupload!_\n\n📎 *Size:* ${backupFile.size}\n🕒 *Time:* ${backupFile.time}\n🔗 *Link:* ${link}`
        }, { quoted: message });

        fs.unlinkSync(backupFile.path);
    } catch (err) {
        console.error('Backup failed:', err);
        await sock.sendMessage(remoteJid, {
            text: `❌ _Gagal melakukan backup:_ ${err.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['backup'],
    OnlyPremium: false,
    OnlyOwner: true
};