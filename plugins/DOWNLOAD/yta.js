const fetch = require('node-fetch');
const CryptoJS = require('crypto-js');
const yts = require('yt-search');
const { extractLink } = require('@lib/utils');
const { logCustom } = require('@lib/logger');

function generateToken() {
    const payload = JSON.stringify({ timestamp: Date.now() });
    const key = 'dyhQjAtqAyTIf3PdsKcJ6nMX1suz8ksZ';
    return CryptoJS.AES.encrypt(payload, key).toString();
}

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        let query = content?.trim();
        if (!query) {
            return sendMessageWithQuote(sock, remoteJid, message,
                `_⚠️ Format Penggunaan:_\n\n💬 Contoh:\n- *${prefix + command} https://youtu.be/xxxx*\n- *${prefix + command} faded alan walker*`
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Cek apakah query berupa link
        let youtubeUrl = extractLink(query);

        // Jika bukan link, lakukan pencarian judul
        if (!youtubeUrl) {
            const result = await yts(query);
            if (!result?.videos?.length) {
                return sendMessageWithQuote(sock, remoteJid, message, '⛔ _Video tidak ditemukan dari judul yang diberikan._');
            }
            youtubeUrl = result.videos[0].url;
        }

        // Request ke endpoint konversi
        const response = await fetch('https://ds1.ezsrv.net/api/convert', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                url: youtubeUrl,
                quality: 128,
                trim: false,
                startT: 0,
                endT: 0,
                token: generateToken()
            })
        });

        const json = await response.json();

        if (!json?.url) {
            await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _Gagal mengambil audio. Coba link lain atau ulangi beberapa saat lagi._');
        }

        await sock.sendMessage(remoteJid, {
            audio: { url: json.url },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

    } catch (err) {
        console.error(err);
        logCustom('error', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, { react: { text: "❌", key: message.key } });
        await sendMessageWithQuote(sock, remoteJid, message, `maaf, terjadi kesalahan:\n\n${err.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['yta'],
    OnlyPremium: false,
    OnlyOwner: true,
    limitDeduction: 1,
};