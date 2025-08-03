const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('@config');
const mess = require('@mess');
const { logWithTime } = require('@lib/utils');
const { addUser, removeUser, isUserPlaying } = require('@tmpDB/tebakmakanan');
const { loadCache, saveCache } = require('@lib/cacheTebakMakanan');

const WAKTU_GAMES = 60;

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 6000,
});

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.toLowerCase().includes("makanan")) return true;

    await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        let dataList = loadCache();

        if (!dataList) {
            const res = await axiosInstance.get(
                `${config.apikey.botz}/api/game/tebakmakanan?apikey=${config.apikey.key}`
            );
            dataList = res.data;

            if (Array.isArray(dataList) && dataList.length > 0) {
                saveCache(dataList);
            } else {
                return await sock.sendMessage(remoteJid, {
                    text: "⚠️ Tidak ada data soal yang tersedia saat ini.",
                }, { quoted: message });
            }
        }

        const random = dataList[Math.floor(Math.random() * dataList.length)];
        const { img, jawaban, deskripsi } = random;

        if (!jawaban || !img || !deskripsi) {
            return await sock.sendMessage(remoteJid, {
                text: "⚠️ Data soal tidak lengkap. Silakan coba lagi.",
            }, { quoted: message });
        }

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
            caption: `🍽️ *Tebak Makanan Nusantara*\n\n🗺️ Deskripsi: ${deskripsi}\n⏱️ Waktu: ${WAKTU_GAMES} detik\n\nKetik nama makanan yang benar!`
        }, { quoted: message });

        logWithTime('Tebak Makanan', `Jawaban: ${jawaban}`);

    } catch (err) {
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Terjadi kesalahan saat memproses permintaan.\n\n${err?.message || err}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tebakmakanan"],
    OnlyPremium: false,
    OnlyOwner: false,
};