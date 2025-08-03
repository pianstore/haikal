const axios = require('axios');
const mess = require('@mess');
const { logWithTime } = require('@lib/utils');
const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tekateki");

const WAKTU_GAMES = 60;

function maskAnswer(answer) {
    const chars = answer.split('');
    return chars.map((char, i) => {
        if (char === ' ') return ' ';
        if (i === 0 || i === chars.length - 1) return char;
        return '×';
    }).join('');
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    if (!fullText.toLowerCase().includes("tekateki")) return true;

    await sock.sendMessage(remoteJid, {
        react: { text: "⏳", key: message.key }
    });

    try {
        const response = await axios.get('https://elrayyxml.vercel.app/games/tekateki');
        const data = response.data;

        if (!data?.result?.soal || !data?.result?.jawaban) {
            throw new Error('Data soal tidak valid dari API');
        }

        const soal = data.result.soal;
        const jawaban = data.result.jawaban.toLowerCase();
        const maskedHint = maskAnswer(jawaban);

        if (isUserPlaying(remoteJid)) {
            return sock.sendMessage(remoteJid, { text: mess.game.isPlaying }, { quoted: message });
        }

        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;
            removeUser(remoteJid);
            const msg = mess.game_handler.waktu_habis.replace('@answer', jawaban);
            await sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
        }, WAKTU_GAMES * 1000);

        addUser(remoteJid, {
            answer: jawaban,
            hadiah: 10,
            command: fullText,
            timer: timer,
            hint: maskedHint,
            fullAnswer: jawaban,
            clueCount: 0
        });

        logWithTime('Game Tekateki', `Jawaban: ${jawaban}`);

        await sock.sendMessage(
            remoteJid,
            {
                text: `🧠 *teka-teki:*\n\n❓ ${soal}\n💡 hint: ${maskedHint}\n\n🕒 waktu: ${WAKTU_GAMES} detik`,
                buttons: [
                    { buttonId: "clue", buttonText: { displayText: "clue" }, type: 1 }
                ],
                footer: "tekan tombol untuk petunjuk tambahan"
            },
            { quoted: message }
        );

    } catch (err) {
        const errMsg = `Gagal memulai game Tekateki.\n\n${err?.response?.data || err.message}`;
        await sock.sendMessage(remoteJid, { text: errMsg }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["tekateki"],
    OnlyPremium: false,
    OnlyOwner: false,
};