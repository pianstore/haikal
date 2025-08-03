const fetch = require('node-fetch');
const { isURL } = require('@lib/utils');
const mess = require('@mess');
const { logCustom } = require('@lib/logger');

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, command } = messageInfo;

    if (!content.trim() || !isURL(content)) {
        return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ format salah atau url tidak valid._\n\n_💬 contoh:_ *${command} link*`);
    }

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        const res = await fetch(`https://elrayyxml.vercel.app/downloader/aio?url=${encodeURIComponent(content)}`);
        const json = await res.json();

        if (!json.status || !json.result || !json.result.medias || json.result.medias.length === 0) {
            return sendMessageWithQuote(sock, remoteJid, message, `_❌ tidak ditemukan media yang bisa diunduh._`);
        }

        const title = json.result.title || 'Untitled';
        const source = json.result.source || '';
        const caption = `📥 *title:* ${title}\n📡 *source:* ${source}\n\n${mess.success}`;

        const media =
            json.result.medias.find(v => v.type === 'video' && v.ext === 'mp4' && v.label?.includes('720')) ||
            json.result.medias.find(v => v.type === 'video' && v.ext === 'mp4') ||
            json.result.medias.find(v => v.type === 'audio' && ['m4a', 'opus'].includes(v.ext)) ||
            json.result.medias.find(v => v.type === 'image') ||
            json.result.medias[0];

        if (media.type === 'video') {
            await sock.sendMessage(remoteJid, {
                video: { url: media.url },
                caption
            }, { quoted: message });

        } else if (media.type === 'image') {
            await sock.sendMessage(remoteJid, {
                image: { url: media.url },
                caption
            }, { quoted: message });

        } else if (media.type === 'audio') {
            const mimetype = media.ext === 'opus' ? 'audio/webm' : 'audio/mp4';
            await sock.sendMessage(remoteJid, {
                audio: { url: media.url },
                mimetype,
                ptt: false
            }, { quoted: message });

        } else {
            await sendMessageWithQuote(sock, remoteJid, message, `⚠️ media tidak didukung: ${media.type || 'unknown'}`);
        }

    } catch (err) {
        console.error(err);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendMessageWithQuote(sock, remoteJid, message, `❌ terjadi kesalahan: ${err.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['alldown','aio', 'aiodl', 'retatube', 'retatubedl'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};