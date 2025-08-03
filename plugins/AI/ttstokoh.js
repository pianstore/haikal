const axios = require('axios');
const { logCustom } = require("@lib/logger");

const TOKOH_DATA = {
    jokowi: {
        speed: -25,
        model: 'id-ID-ArdiNeural-Male',
        tune: -3
    },
    megawati: {
        speed: -16,
        model: 'id-ID-GadisNeural-Female',
        tune: 2
    },
    prabowo: {
        speed: -25,
        model: 'id-ID-ArdiNeural-Male',
        tune: 2
    }
};

// Fungsi polling cepat (2 detik)
async function waitForAudio(session_hash) {
    for (let i = 0; i < 20; i++) {
        const { data } = await axios.get(`https://deddy-tts-rvc-tokoh-indonesia.hf.space/queue/data?session_hash=${session_hash}`);
        const lines = data.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                const d = JSON.parse(line.substring(6));
                if (d.msg === 'process_completed') {
                    return d.output.data[2].url;
                }
            }
        }
        await new Promise(r => setTimeout(r, 2000)); // polling setiap 2 detik
    }
    throw new Error('Timeout: Tidak mendapatkan audio URL.');
}

async function generateTTSTokoh(text, tokoh) {
    const session_hash = Math.random().toString(36).substring(2);
    const dataTokoh = TOKOH_DATA[tokoh];

    await axios.post('https://deddy-tts-rvc-tokoh-indonesia.hf.space/queue/join?', {
        data: [
            tokoh,
            dataTokoh.speed,
            text,
            dataTokoh.model,
            dataTokoh.tune,
            'rmvpe',
            0.5,
            0.33
        ],
        event_data: null,
        fn_index: 0,
        trigger_id: 20,
        session_hash
    });

    const audioUrl = await waitForAudio(session_hash);
    return audioUrl;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted } = messageInfo;

    const tokoh = command.toLowerCase();
    const text = content?.trim() || isQuoted?.text;

    if (!TOKOH_DATA[tokoh]) {
        return sock.sendMessage(remoteJid, {
            text: `⚠️ Tokoh tidak dikenal.\n\nGunakan salah satu: ${Object.keys(TOKOH_DATA).join(', ')}`
        }, { quoted: message });
    }

    if (!text || text.length < 1) {
        return sock.sendMessage(remoteJid, {
            text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ *${prefix + command} selamat datang di grup ini!*`
        }, { quoted: message });
    }

    if (text.length > 120) {
        return sock.sendMessage(remoteJid, {
            text: '⚠️ Teks terlalu panjang. Maksimal 120 karakter.'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(remoteJid, {
            react: { text: '🎙️', key: message.key }
        });

        const audioUrl = await generateTTSTokoh(text, tokoh);
        const { data: buffer } = await axios.get(audioUrl, { responseType: 'arraybuffer' });

        await sock.sendMessage(remoteJid, {
            audio: buffer,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: message });

    } catch (err) {
        logCustom('error', text, `ERROR-COMMAND-${command}.txt`);
        console.error('Terjadi kesalahan:', err.message);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Gagal memproses suara tokoh.\n\n${err.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['jokowi', 'megawati', 'prabowo'],
    OnlyPremium: false,
    OnlyOwner: false
};