const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('@config');
const mess = require('@mess');
const { logWithTime } = require('@lib/utils');
const { addUser, removeUser, isUserPlaying } = require('@tmpDB/tebakheroml');
const { loadCache, saveCache } = require('@lib/cacheTebakHero');

const WAKTU_GAMES = 60;

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 6000,
});

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.toLowerCase().includes("hero")) return true;

    // Kirim emoji loading lebih awal
    await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        // Cek cache
        let dataList = loadCache();

        // Jika cache kosong atau expired, fetch baru
        if (!dataList) {
            const res = await axiosInstance.get(`${config.apikey.botz}/api/game/tebakheroml?apikey=${config.apikey.key}`);
            dataList = res.data;

            if (Array.isArray(dataList) && dataList.length > 0) {
                saveCache(dataList);
            } else {
                return await sock.sendMessage(remoteJid, {
                    text: "⚠️ Tidak ada data soal yang tersedia saat ini.",
                }, { quoted: message });
            }
        }

        // Pilih 1 soal acak
        const random = dataList[Math.floor(Math.random() * dataList.length)];
        const { img, jawaban, deskripsi } = random;

        if (!jawaban || !img || !deskripsi) {
            return await sock.sendMessage(remoteJid, {
                text: "⚠️ Data hero tidak lengkap. Silakan coba lagi.",
            }, { quoted: message });
        }

        // Cegah spam game
        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(remoteJid, {
                text: mess.game.isPlaying,
            }, { quoted: message });
        }

        // Set timer untuk waktu habis
        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;
            removeUser(remoteJid);

            if (mess.game_handler?.waktu_habis) {
                const msg = mess.game_handler.waktu_habis.replace('@answer', jawaban);
                await sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);

        // Simpan data permainan
        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah: 10,
            command: fullText,
            timer: timer
        });

        // Kirim soal
        await sock.sendMessage(remoteJid, {
            image: { url: img },
            caption: `🧠 *Tebak Hero MLBB*\n\n📝 Deskripsi: ${deskripsi}\n⏱️ Waktu: ${WAKTU_GAMES} detik\n\nKetik nama hero yang benar!`
        }, { quoted: message });

        logWithTime('Tebak Hero ML', `Jawaban: ${jawaban}`);

    } catch (err) {
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Terjadi kesalahan saat memproses permintaan.\n\n${err?.message || err}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tebakhero", "tebakheroml"],
    OnlyPremium: false,
    OnlyOwner: false,
};