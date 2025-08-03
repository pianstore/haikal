const { logWithTime, sendMessageWithMention } = require('@lib/utils');
const mess = require('@mess');

const gombalList = [
    "Kamu tahu nggak? Aku rela jadi bintang, cuma buat menerangi malammu yang gelap.",
    "Cintaku ke kamu tuh kayak waktu, nggak akan pernah berhenti berjalan.",
    "Kalau cinta itu lagu, kamu adalah nada terindah yang mengisi hatiku.",
    "Aku nggak butuh surga, karena aku sudah menemukan surga dalam senyummu.",
    "Setiap detak jantungku berbisik namamu, kamu tuh bener-bener segalanya buatku.",
    "Kamu itu kayak hujan di kemarau panjang, bikin hidupku seger lagi.",
    "Aku nggak bisa jadi pahlawan super, tapi aku janji bakal selalu jadi tempatmu bersandar.",
    "Biar aku nggak jadi yang pertama, aku mau jadi yang terakhir di hatimu.",
    "Kamu nggak perlu make up, karena hatimu udah bikin kamu secantik bidadari.",
    "Aku nggak butuh kamera buat mengabadikanmu, cukup aku simpan kamu di hati selamanya.",
    "Kamu kayak oksigen buat aku, nggak kelihatan tapi bikin aku hidup.",
    "Setiap senyumanmu bikin aku lupa dunia, cuma mau fokus ke kamu.",
    "Kamu tahu nggak? Aku belajar mencintaimu tanpa alasan, dan aku nggak butuh alasan buat tetap cinta.",
    "Aku mau jadi payung buat kamu, biar kamu nggak kehujanan sama masalah hidup.",
    "Kalau kamu bintang, aku rela jadi langit yang selalu ngelindungin kamu.",
    "Kamu itu bukan cuma spesial, kamu itu segalanya buat aku.",
    "Aku nggak butuh liburan mewah, yang aku butuhin cuma kamu di sisiku.",
    "Cinta aku ke kamu tuh kayak angin, nggak kelihatan tapi selalu terasa di hati.",
    "Aku janji nggak akan pernah lelah buat bikin kamu bahagia.",
    "Kalau aku boleh minta satu hal, aku cuma mau selamanya bisa mencintaimu.",
    "Kamu tuh kayak mentari pagi, yang selalu bikin aku semangat memulai hari.",
    "Aku nggak bisa nyanyi, tapi aku mau jadi lagu yang selalu kamu putar di hati.",
    "Kamu itu bagaikan hujan pertama di musim kemarau, bikin hati aku adem dan berbunga-bunga.",
    "Aku rela jadi boneka salju yang meleleh, asalkan bisa ada di pelukanmu.",
    "Cintaku ke kamu tuh kayak wifi unlimited, nggak ada batasannya.",
    "Kamu itu kayak lilin di malam gelap, selalu bikin aku hangat dan nyaman.",
    "Setiap momen bersamamu tuh kayak sunset di tepi pantai, bikin aku betah berlama-lama.",
    "Aku nggak butuh GPS buat nyari cinta sejati, karena aku udah nemuin kamu.",
    "Kalau aku jadi pena, kamu adalah tinta yang bikin aku hidup.",
    "Kamu bagaikan semesta dalam hatiku, luas dan nggak ada ujungnya.",
    "Aku nggak butuh bintang jatuh buat minta harapan, karena aku cuma mau kamu jadi bahagiaku.",
    "Setiap langkah aku selalu menuju kamu, nggak pernah nyasar ke hati orang lain.",
    "Kamu itu bukan cuma bunga di taman, kamu adalah bunga yang selalu mekar di hati aku.",
    "Aku nggak perlu hujan rintik romantis, karena kamu udah cukup bikin hati aku adem.",
    "Kalau aku jadi gitar, kamu adalah nada yang bikin aku hidup dan berirama.",
    "Aku rela jadi puisi, asalkan kamu yang membacakannya di setiap malamku.",
    "Kamu itu bagaikan kopi tanpa gula, pahitnya nggak kerasa karena senyummu yang manis.",
    "Aku mau jadi payung hatimu, yang selalu siap melindungimu dari badai apapun.",
    "Setiap detik aku bareng kamu tuh kayak dunia berhenti, biar aku bisa nikmatin kamu lebih lama.",
    "Kamu itu seperti mimpi yang nggak pernah aku mau bangun darinya."
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, isGroup, sender, content } = messageInfo;

    // Auto-reply gombal jika ada yang mengetik "gombalin aku"
    if (content && content.toLowerCase().includes('gombalin aku')) {
        const gombal = getRandomItem(gombalList);
        return sock.sendMessage(remoteJid, { text: gombal }, { quoted: message });
    }

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

        const gombal = getRandomItem(gombalList);
        const text = `@${target.id.split('@')[0]}, ${gombal}`;

        await sendMessageWithMention(sock, remoteJid, text, message);

        logWithTime('Gombal Super Romantis', `Target: ${target.id} | Isi: ${gombal}`);
    } catch (err) {
        console.error("Error gombal random:", err);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Terjadi kesalahan saat menjalankan perintah gombal." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["gombal"],
    OnlyPremium: false,
    OnlyOwner: false
};