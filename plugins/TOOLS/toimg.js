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

        if (mediaType !== "sticker") {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Kirim/Balas sticker dengan caption *${prefix + command}*_` },
                { quoted: message }
            );
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join("tmp", media);
        if (!fs.existsSync(mediaPath)) throw new Error("❌ File media tidak ditemukan.");

        // Upload ke Uguu dulu, fallback ke Catbox
        let imageUrl = await uploadToUguu(mediaPath);
        if (!imageUrl) imageUrl = await uploadToCatbox(mediaPath);
        if (!imageUrl) throw new Error("❌ Upload gagal ke Uguu maupun Catbox.");

        // Kirim ke endpoint konversi WebP → JPG
        const convertUrl = `https://arincy.vercel.app/api/tojpg?url=${encodeURIComponent(imageUrl)}`;
        const convertRes = await axios.get(convertUrl);

        if (!convertRes.data?.status || !convertRes.data?.data?.url) {
            throw new Error("❌ Gagal mengonversi ke JPG.");
        }

        // Ambil buffer JPG
        const imageBuffer = await axios.get(convertRes.data.data.url, {
            responseType: 'arraybuffer'
        });

        await sock.sendMessage(
            remoteJid,
            {
                image: imageBuffer.data,
                caption: mess.general.success
            },
            { quoted: message }
        );

        fs.unlink(mediaPath);
    } catch (error) {
        console.error("❌ Plugin toimg error:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "❌ Maaf, terjadi kesalahan saat mengubah sticker ke gambar." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["toimg"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};