const { reply } = require('@lib/utils');
const axios = require("axios");

async function handle(sock, messageInfo) {
    const { m, fullText, remoteJid } = messageInfo;

    // Ambil isi setelah command
    const args = fullText.replace(/^\.?faceswap/i, '').trim();

    // Split berdasarkan: | atau newline atau 2 spasi
    const parts = args.split(/\s*\|\s*|\n|\s{2,}/).map(s => s.trim()).filter(Boolean);

    if (parts.length !== 2 || !parts[0].startsWith('http') || !parts[1].startsWith('http')) {
        return await reply(m, `⚠️ Link tidak valid.\n\nGunakan format:\n.faceswap <link source> | <link target>\n\nContoh:\n.faceswap https://catbox.moe/a.jpg | https://catbox.moe/b.jpg`);
    }

    const [sourceRaw, targetRaw] = parts;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "🧠", key: m.key } });

        const apiURL = `https://zenzxz.dpdns.org/ai/faceswap?source=${encodeURIComponent(sourceRaw)}&target=${encodeURIComponent(targetRaw)}`;
        const { data } = await axios.get(apiURL);

        if (!data?.status || !data?.image) {
            throw new Error("Gagal memproses faceswap dari API.");
        }

        await sock.sendMessage(remoteJid, {
            image: { url: data.image },
            caption: `_✅ Faceswap sukses!_\n⏱️ *Durasi:* ${data.duration}`
        }, { quoted: m });

    } catch (err) {
        console.error("[Faceswap Error]:", err);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Faceswap gagal:\n${err.message || "Terjadi kesalahan internal."}`
        }, { quoted: m });
    }
}

module.exports = {
    handle,
    Commands: ["faceswap"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};