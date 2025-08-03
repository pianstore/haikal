const axios = require('axios');
const config = require('@config');
const mess = require('@mess');
const { logWithTime } = require('@lib/utils');

const WAKTU_GAMES = 60; // detik
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/susunkata");

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.includes("kata")) return true;

await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        const response = await axios.get('https://elrayyxml.vercel.app/games/susunkata');
        const data = response.data;

        // ✅ Ambil dari nested "data"
        if (!data || !data.data || !data.data.soal || !data.data.jawaban) {
            throw new Error('Data soal tidak valid dari API');
        }

        const soal = data.data.soal;
        const jawaban = data.data.jawaban;

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

            if (mess.game_handler.waktu_habis) {
                const messageWarning = mess.game_handler.waktu_habis.replace('@answer', jawaban);
                await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);

        addUser(remoteJid, {
            answer: jawaban.toLowerCase(),
            hadiah: 10,
            command: fullText,
            timer: timer
        });
        
        logWithTime('Susun Kata', `Jawaban: ${jawaban}`);

        await sock.sendMessage(
            remoteJid,
            { text: `🔤 Susun huruf menjadi kata yang benar:\n\n${soal}\n\n🕒 Waktu: ${WAKTU_GAMES}s` },
            { quoted: message }
        );

    } catch (error) {
        const errMsg = `Terjadi kesalahan saat memulai game.\n\n${error?.response?.data || error.message}`;
        await sock.sendMessage(
            remoteJid,
            { text: errMsg },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["susunkata"],
    OnlyPremium: false,
    OnlyOwner: false,
};