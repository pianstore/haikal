const { reply } = require("@lib/utils");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    // Validasi input
    if (!content || !content.includes('whatsapp.com/channel/')) {
        return await reply(m, `_⚠️ Format Salah!_\n\n_💬 Contoh:_ _${prefix + command} https://whatsapp.com/channel/0029VaGDC0MEzZVPq4XjGE_`);
    }

    try {
        await sock.sendMessage(remoteJid, { react: { text: "🔍", key: message.key } });

        const res = await fetch(content);
        if (!res.ok) throw new Error(`Gagal mengakses halaman: ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const name = $('meta[property="og:title"]').attr('content') || 'Tidak ditemukan';
        const description = $('meta[property="og:description"]').attr('content') || 'Tidak ditemukan';
        const image = $('meta[property="og:image"]').attr('content');

        const channelDetails = `「 _*Info Channel WhatsApp*_ 」\n\n` +
            `◧ *Nama:* ${name}\n` +
            `◧ *Deskripsi:* ${description}\n` +
            `🔗 *Link:* ${content}`;

        if (image) {
            await sock.sendMessage(
                remoteJid,
                {
                    image: { url: image },
                    caption: channelDetails,
                },
                { quoted: message }
            );
        } else {
            await reply(m, channelDetails);
        }

    } catch (err) {
        console.error('❌ ERROR channelwhatsappstalk:', err);
        return await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Gagal mengambil informasi channel. Pastikan link valid." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["channelwhatsappstalk", "chwastalk", "chstalk"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};