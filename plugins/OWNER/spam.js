const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");

async function sendTextMessage(sock, remoteJid, text, quoted) {
    return await sock.sendMessage(remoteJid, { text }, { quoted });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isGroup } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);

        if (!content.includes("|")) {
            return await sendTextMessage(sock, remoteJid, `⚠️ Format salah.\nContoh: .spam halo @tag|5`, message);
        }

        // Pecah jadi teks dan jumlah
        const [textRaw, jumlahStr] = content.split("|");
        const jumlah = parseInt(jumlahStr.trim());
        if (isNaN(jumlah) || jumlah <= 0 || jumlah > 50) {
            return await sendTextMessage(sock, remoteJid, `⚠️ Jumlah spam harus antara 1–50.`, message);
        }

        // Deteksi nomor yang ditag dari teks (misalnya: @6281234567890)
        const tagMatch = textRaw.match(/@(\d{5,20})/);
        const text = textRaw.trim();
        const mentions = [];

        if (tagMatch) {
            const number = tagMatch[1];
            const waId = `${number}@s.whatsapp.net`;
            mentions.push(waId);

            for (let i = 0; i < jumlah; i++) {
                await sock.sendMessage(
                    remoteJid,
                    {
                        text: text,
                        mentions
                    },
                    { quoted: message }
                );
                await new Promise(res => setTimeout(res, 1000));
            }
        } else {
            // Tidak ada tag, kirim biasa
            for (let i = 0; i < jumlah; i++) {
                await sock.sendMessage(
                    remoteJid,
                    { text },
                    { quoted: message }
                );
                await new Promise(res => setTimeout(res, 1000));
            }
        }

    } catch (error) {
        console.error("Error spam:", error);
        await sendTextMessage(sock, remoteJid, `⚠️ Terjadi kesalahan: ${error.message}`, message);
    }
}

module.exports = {
    handle,
    Commands: ["spam"],
    OnlyPremium: false,
    OnlyOwner: true // Hanya owner
};