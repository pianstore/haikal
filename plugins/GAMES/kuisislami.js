const axios         = require('axios');
const config        = require('@config');
const mess          = require('@mess');
const { logWithTime } = require('@lib/utils');
const { addUser, removeUser, isUserPlaying } = require("@tmpDB/kuisislami");

const WAKTU_GAMES = 60;
const APIKEY = config.apikey.key;
const BASEURL = config.apikey.botz;

// === Caching Soal Lokal ===
let cacheSoal = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 2; // 2 menit

async function getCachedSoal() {
    const now = Date.now();
    if (now - lastFetchTime > CACHE_DURATION || cacheSoal.length === 0) {
        const res = await axios.get(`${BASEURL}/api/game/kuisislami?apikey=${APIKEY}`);
        cacheSoal = res.data;
        lastFetchTime = now;
    }
    return cacheSoal;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.toLowerCase().includes("kuisislami")) return true;

    await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        const soalList = await getCachedSoal();
        const soalData = soalList[Math.floor(Math.random() * soalList.length)];

        if (!soalData || !soalData.soal || !soalData.pilihan) {
            return await sock.sendMessage(remoteJid, {
                text: '⚠️ Soal tidak valid dari API.',
            }, { quoted: message });
        }

        const { soal, jawaban, pilihan, deskripsi } = soalData;

        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying },
                { quoted: message }
            );
        }

        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;
            removeUser(remoteJid);
            const waktuHabisMsg = mess.game_handler.waktu_habis.replace('@answer', jawaban);
            await sock.sendMessage(remoteJid, { text: waktuHabisMsg }, { quoted: message });
        }, WAKTU_GAMES * 1000);

        const formattedOptions = pilihan.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');

        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah: 10,
            command: fullText,
            deskripsi: deskripsi,
            timer: timer
        });

        await sock.sendMessage(
            remoteJid,
            {
                text: `🕌 *KUIS ISLAMI*\n\n❓ *${soal}*\n\n${formattedOptions}\n\n⏱️ Waktu: ${WAKTU_GAMES} detik\n\nBalas dengan jawaban yang tepat!`
            },
            { quoted: message }
        );

        logWithTime('Kuis Islami', `Jawaban: ${jawaban}`);

    } catch (err) {
        await sock.sendMessage(
            remoteJid,
            { text: `❌ Gagal mengambil soal.\n\n${err.message || err}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["kuisislami", "quizislami"],
    OnlyPremium: false,
    OnlyOwner: false
};