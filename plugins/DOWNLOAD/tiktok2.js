const fetch = require('node-fetch');
const { extractLink } = require('@lib/utils');
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

function isTikTokUrl(url) {
    return /tiktok\.com/i.test(url);
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    const validLink = extractLink(content);

    if (!content.trim() || !validLink) {
        return sendMessageWithQuote(sock, remoteJid, message,
            `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ _*${prefix + command} https://vt.tiktok.com/xxxxx*_`);
    }

    if (!isTikTokUrl(validLink)) {
        return sendMessageWithQuote(sock, remoteJid, message,
            '⚠️ URL yang Anda masukkan tidak valid. Pastikan berasal dari TikTok.');
    }

    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    try {
        const apiUrl = `https://zenzxz.dpdns.org/downloader/tiktok?url=${encodeURIComponent(validLink)}`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        const data = json?.result?.data;
        const author = data?.author || {};
        const music = data?.music_info || {};

        if (!data) {
            return sendMessageWithQuote(sock, remoteJid, message, '⚠️ Gagal mengambil video. Silakan coba lagi.');
        }

        const caption =
`🎬 *${data.title || 'Video TikTok'}*

❤️ *Like:* ${data.digg_count}
💬 *Komentar:* ${data.comment_count}
⭐ *Favorit:* ${data.collect_count}
🔁 *Share:* ${data.share_count}
👁️ *Tonton:* ${data.play_count}
📥 *Unduhan:* ${data.download_count}

👤 *Pembuat:* ${author.nickname || '-'} (@${author.unique_id || '-'})
🌍 *Wilayah:* ${data.region}
📅 *Tanggal Upload:* ${formatDate(data.create_time)}
⏳ *Durasi:* ${data.duration}s

🎶 *Musik:* ${music.title || '-'} - ${music.author || '-'}
`;

        // Kirim video
        await sock.sendMessage(remoteJid, {
            video: { url: data.hdplay },
            caption
        }, { quoted: message });

        // Kirim audio TikTok langsung
        if (data.music) {
            await sock.sendMessage(remoteJid, {
                audio: { url: data.music },
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: message });
        }

    } catch (error) {
        console.error("Kesalahan TikTok:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        const errorMessage = `❌ Gagal memproses video.\n\n*Detail:* ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['tiktok2','tt2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};