const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const mess = require("@mess");

async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(filePath));

        const response = await axios.post('https://uguu.se/upload', form, {
            headers: { ...form.getHeaders() }
        });

        if (response.data?.files?.[0]?.url) {
            return response.data.files[0].url;
        }

        throw new Error('Format respons Uguu tidak sesuai.');
    } catch (error) {
        console.error('❌ Upload ke Uguu gagal:', error.response?.data || error.message);
        return null;
    }
}

async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        });

        return response.data;
    } catch (error) {
        console.error('❌ Upload ke Catbox gagal:', error.response?.data || error.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;

        if (mediaType !== "sticker" && mediaType !== "image") {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Kirim/Balas sticker atau gambar dengan caption *${prefix + command}*_` },
                { quoted: message }
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join("tmp", media);
        if (!fs.existsSync(mediaPath)) throw new Error("❌ File media tidak ditemukan.");

        // Upload ke Uguu lalu fallback ke Catbox
        let imageUrl = await uploadToUguu(mediaPath);
        if (!imageUrl) imageUrl = await uploadToCatbox(mediaPath);
        if (!imageUrl) throw new Error("❌ Upload gagal ke Uguu maupun Catbox.");

        // Konversi ke MP4 via Arincy
        const convertUrl = `https://arincy.vercel.app/api/tomp4?url=${encodeURIComponent(imageUrl)}`;
        const convertRes = await axios.get(convertUrl);

        if (!convertRes.data?.status || !convertRes.data?.data?.url) {
            throw new Error("❌ Gagal konversi WebP ke MP4.");
        }

        // Ambil buffer video
        const videoBuffer = await axios.get(convertRes.data.data.url, {
            responseType: 'arraybuffer'
        });

        await sock.sendMessage(
            remoteJid,
            {
                video: videoBuffer.data,
                gifPlayback: command === 'togif',
                caption: ''
            },
            { quoted: message }
        );

        fs.unlink(mediaPath); // Hapus file sementara
    } catch (error) {
        console.error("❌ Plugin togif/tovid error:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "❌ Maaf, terjadi kesalahan saat mengubah sticker ke video." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["togif", "tovid"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};