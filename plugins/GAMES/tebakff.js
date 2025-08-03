const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('@config');
const mess = require('@mess');
const { logWithTime } = require('@lib/utils');
const { addUser, removeUser, isUserPlaying } = require('@tmpDB/tebakff');

const WAKTU_GAMES = 60;

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 6000,
});

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.toLowerCase().includes("ff")) return true;

    await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        const res = await axiosInstance.get('https://api.vreden.my.id/api/tebakff');
        const result = res.data?.result;

        if (!result || !result.jawaban || !result.img) {
            return await sock.sendMessage(remoteJid, {
                text: "⚠️ gagal mendapatkan soal dari server.",
            }, { quoted: message });
        }

        const { jawaban, img } = result;

        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(remoteJid, {
                text: mess.game.isPlaying,
            }, { quoted: message });
        }

        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;
            removeUser(remoteJid);

            if (mess.game_handler?.waktu_habis) {
                const msg = mess.game_handler.waktu_habis.replace('@answer', jawaban);
                await sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);

        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah: 10,
            command: fullText,
            timer: timer
        });

        await sock.sendMessage(remoteJid, {
            image: { url: img },
            caption: `🧠 *tebak karakter free fire*\n\n🖼️ tebak nama karakter pada gambar berikut!\n⏱️ waktu: ${WAKTU_GAMES} detik\n\nketik nama karakter yang benar! ketik *nyerah* untuk nyerah`
        }, { quoted: message });

        logWithTime('Tebak FF', `jawaban: ${jawaban}`);

    } catch (err) {
        await sock.sendMessage(remoteJid, {
            text: `⚠️ terjadi kesalahan saat mengambil soal.\n\n${err?.message || err}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tebakff"],
    OnlyPremium: false,
    OnlyOwner: false,
};