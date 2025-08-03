const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    try {
        if (!content || !content.includes('|')) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} judul | lirik lagu | mood | genre | gender*_`
            }, { quoted: message });
        }

        const [title, lyrics, mood, genre, gender] = content.split('|').map(v => v.trim());

        if (!title) return sock.sendMessage(remoteJid, { text: '❌ Judul lagu kosong' }, { quoted: message });
        if (!lyrics) return sock.sendMessage(remoteJid, { text: '❌ Lirik lagu kosong' }, { quoted: message });
        if (lyrics.length > 1500) return sock.sendMessage(remoteJid, { text: '❌ Lirik tidak boleh lebih dari 1500 karakter' }, { quoted: message });

        await sock.sendMessage(remoteJid, { text: '🎵 Generating lagu, tunggu ya bree...' }, { quoted: message });

        const deviceId = uuidv4();
        const userHeaders = {
            'user-agent': 'NB Android/1.0.0',
            'content-type': 'application/json',
            'accept': 'application/json',
            'x-platform': 'android',
            'x-app-version': '1.0.0',
            'x-country': 'ID',
            'accept-language': 'id-ID',
            'x-client-timezone': 'Asia/Jakarta',
        };

        const msgId = uuidv4();
        const time = Date.now().toString();
        const fcmToken = 'eqnTqlxMTSKQL5NQz6r5aP:APA91bHa3...'; // optional static token

        const registerHeaders = {
            ...userHeaders,
            'x-device-id': deviceId,
            'x-request-id': msgId,
            'x-message-id': msgId,
            'x-request-time': time
        };

        const reg = await axios.put('https://musicai.apihub.today/api/v1/users', {
            deviceId,
            fcmToken
        }, { headers: registerHeaders });

        const userId = reg.data.id;

        const createHeaders = {
            ...registerHeaders,
            'x-client-id': userId
        };

        const body = {
            type: 'lyrics',
            name: title,
            lyrics,
            ...(mood && { mood }),
            ...(genre && { genre }),
            ...(gender && { gender })
        };

        const create = await axios.post('https://musicai.apihub.today/api/v1/song/create', body, { headers: createHeaders });
        const songId = create.data.id;

        const checkHeaders = {
            ...userHeaders,
            'x-client-id': userId
        };

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        let found = null, attempt = 0;

        while (true) {
            const check = await axios.get('https://musicai.apihub.today/api/v1/song/user', {
                params: {
                    userId,
                    isFavorite: false,
                    page: 1,
                    searchText: ''
                },
                headers: checkHeaders
            });

            found = check.data.datas.find(song => song.id === songId);

            if (!found) {
                return await sock.sendMessage(remoteJid, { text: '❌ Lagu tidak ditemukan, coba lagi nanti.' }, { quoted: message });
            }

            if (found.url) {
                await sock.sendMessage(remoteJid, {
                    audio: { url: found.url },
                    mimetype: 'audio/mpeg',
                    fileName: `${found.name}.mp3`,
                    ptt: false,
                    contextInfo: {
                        forwardingScore: 999999,
                        isForwarded: true,
                        externalAdReply: {
                            title: `Suno Music AI`,
                            body: `${found.name} | Status: ${found.status}`,
                            mediaType: 1,
                            previewType: 0,
                            renderLargerThumbnail: false,
                            thumbnailUrl: found.thumbnail_url,
                            sourceUrl: found.url
                        }
                    }
                }, { quoted: message });
                return;
            }

            if (++attempt > 30) {
                return await sock.sendMessage(remoteJid, { text: '⏳ Proses terlalu lama. Coba lagi nanti ya!' }, { quoted: message });
            }

            await delay(3000);
        }

    } catch (error) {
        logCustom('error', content, `ERROR-COMMAND-${command}.txt`);
        console.error('⚠️ Error Suno Plugin:', error);

        return await sock.sendMessage(remoteJid, {
            text: `❌ Gagal: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['sonu'],
    OnlyPremium: false,
    OnlyOwner: false
};