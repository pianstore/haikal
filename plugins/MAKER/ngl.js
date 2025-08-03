const axios = require("axios");
const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { content, m } = messageInfo;

    // Pisahkan input menjadi dua bagian: link dan teks pesan
    const [link, ...textParts] = content.trim().split(" ");
    const text = textParts.join(" ");

    if (!link || !text) {
        return await reply(m, `⚠️ Format salah!\n\nContoh:\n.ngl https://ngl.link/haikal halo`);
    }

    try {
        const res = await axios.get('https://nirkyy-dev.hf.space/api/v1/sendngl', {
            params: {
                text,
                link
            }
        });

        if (res.data.success) {
            await reply(m, `✅ Pesan berhasil dikirim ke *NGL*!\n\n📨 ID: ${res.data.data.questionId}\n🌍 Wilayah: ${res.data.data.userRegion}`);
        } else {
            await reply(m, `❌ Gagal mengirim pesan. Respon tidak sukses.`);
        }
    } catch (err) {
        console.error(err);
        const msg = err.response?.data || err.message;
        await reply(m, `❌ Terjadi kesalahan saat mengirim pesan:\n${JSON.stringify(msg, null, 2)}`);
    }
}

module.exports = {
    handle,
    Commands: ["ngl"],
    OnlyPremium: false,
    OnlyOwner: false
};