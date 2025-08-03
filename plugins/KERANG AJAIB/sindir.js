const { logWithTime, sendMessageWithMention } = require('@lib/utils');
const mess = require('@mess');

const sindiranList = [
    "Punya logika, tapi kayaknya dikunci di rumah.",
    "Sibuk menilai orang lain, lupa ngaca.",
    "Suaranya keras, tapi isinya kosong.",
    "Belajar itu penting, apalagi kalau belum tau malu.",
    "Kamu tuh kayak sinyal, kadang ada kadang nggak jelas.",
    "Ngomongnya bijak, kelakuannya bikin nyesek.",
    "Suka muncul pas butuh doang, sisanya ngilang.",
    "Pura-pura nggak tau biar nggak disuruh mikir, ya?",
    "Update story tiap jam, kerjaannya mana?",
    "Muka dua sih biasa, ini udah muka lima.",
    "Sibuk cari perhatian, tapi gak ada yang peduli.",
    "Pura-pura polos, padahal otaknya keliling dunia.",
    "Nyari validasi online terus, realitanya hampa.",
    "Gaya sultan, dompet tahan.",
    "Sombongnya duluan, isi belakangan.",
    "Senyum terus, biar nutupin isi hati yang fake.",
    "Berisik banget, ternyata cuma pengalihan rasa insecure.",
    "Ngomongnya pintar, tapi logikanya cuti.",
    "Dikit-dikit update, dikira hidupnya sinetron.",
    "Pede banget, padahal gak ada yang dukung.",
    "Tampangmu sih tegas, tapi keputusanmu bimbang.",
    "Sok dewasa, padahal ngambek kayak bocah TK.",
    "Sibuk ngurusin hidup orang, hidup sendiri berantakan.",
    "Hobinya ngomen, padahal belum tentu bener.",
    "Sok tegas, padahal takut ditinggal.",
    "Mainnya drama terus, cocok casting sinetron.",
    "Omongannya manis, tindakannya pahit.",
    "Berasa pusat dunia, padahal figuran juga nggak.",
    "Dandan sih niat, sayang attitude-nya lupa dipoles.",
    "Sibuk cari muka, padahal mukanya biasa aja.",
    "Banyak gaya, prestasi mana?",
    "Kritik semua orang, lupa intropeksi diri sendiri.",
    "Omonganmu keras, padahal isinya kosong.",
    "Sibuk update pencapaian, padahal hasil tim.",
    "Senyumnya palsu, ketulusannya hilang.",
    "Tiap ngomong sok penting, padahal nggak ngaruh apa-apa.",
    "Tampilannya wow, isinya low.",
    "Sibuk nyindir orang, lupa dia juga gak sempurna.",
    "Pintarnya bikin kesal, bukan kagum.",
    "Suka drama, terus bilang gak suka ribet."
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, isGroup, sender } = messageInfo;

    if (!isGroup) {
        return sock.sendMessage(remoteJid, { text: mess.groupOnly }, { quoted: message });
    }

    try {
        const groupMetadata = await sock.groupMetadata(remoteJid);
        const participants = groupMetadata.participants;

        let target;
        do {
            target = getRandomItem(participants);
        } while (target.id === sender);

        const sindiran = getRandomItem(sindiranList);
        const text = `@${target.id.split('@')[0]}, ${sindiran}`;

        await sendMessageWithMention(sock, remoteJid, text, message);

        logWithTime('Sindir Random', `Target: ${target.id} | Isi: ${sindiran}`);
    } catch (err) {
        console.error("Error sindir random:", err);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Terjadi kesalahan saat menjalankan perintah sindir." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["sindir"],
    OnlyPremium: false,
    OnlyOwner: false
};