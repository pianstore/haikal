const axios = require("axios");

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, prefix, command } = messageInfo;

    try {
        const text = content ?? null;
        const [name, username] = text?.split("|").map(s => s.trim()) ?? [];

        if (!name || !username) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ *${prefix + command} haikal | haikal*_`
            }, { quoted: message });
            return;
        }

        // Reaksi loading
        await sock.sendMessage(remoteJid, {
            react: { text: "⏳", key: message.key }
        });

        // Ambil foto profil user
        const ppuser = await sock.profilePictureUrl(sender, 'image')
            .catch(() => 'https://files.catbox.moe/gqs7oz.jpg');

        // Endpoint gambar
        const apiUrl = `https://flowfalcon.dpdns.org/imagecreator/faketiktok?name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&pp=${encodeURIComponent(ppuser)}`;

        // Ambil buffer dari API
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const bufferImage = Buffer.from(response.data);

        // Kirim sebagai gambar biasa (foto)
        await sock.sendMessage(remoteJid, {
    image: bufferImage
}, { quoted: message });

        // Reaksi selesai
        await sock.sendMessage(remoteJid, {
            react: { text: "✅", key: message.key }
        });

    } catch (error) {
        await sock.sendMessage(remoteJid, {
            text: `❌ gagal membuat gambar faketiktok.\n\nerror: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['faketiktok','fakett'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};