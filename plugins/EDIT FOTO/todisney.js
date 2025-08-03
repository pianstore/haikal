const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const config = require("@config");

// Upload ke Uguu
async function uploadToUguu(filePath) {
    try {
        const form = new FormData();
        form.append("files[]", fs.createReadStream(filePath));

        const response = await axios.post("https://uguu.se/upload", form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data?.files?.[0]?.url) {
            return response.data.files[0].url;
        }

        throw new Error("Format respons Uguu tidak sesuai.");
    } catch (error) {
        console.error("❌ Upload ke Uguu gagal:", error.response?.data || error.message);
        return null;
    }
}

// Fallback ke Catbox
async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(filePath));

        const response = await axios.post("https://catbox.moe/user/api.php", form, {
            headers: {
                ...form.getHeaders()
            }
        });

        return response.data;
    } catch (error) {
        console.error("❌ Upload ke Catbox gagal:", error.response?.data || error.message);
        return null;
    }
}

// Handler utama
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!["image", "sticker"].includes(mediaType)) {
            return await reply(m, `⚠️ _kirim/balas gambar atau stiker dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🕒", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join("tmp", media);
        if (!fs.existsSync(mediaPath)) throw new Error("❌ File media tidak ditemukan setelah diunduh.");

        // Upload ke Uguu → fallback ke Catbox
        let uploadedUrl = await uploadToUguu(mediaPath);
        if (!uploadedUrl) uploadedUrl = await uploadToCatbox(mediaPath);
        if (!uploadedUrl) throw new Error("❌ Gagal upload ke Uguu maupun Catbox.");

        // Kirim ke API JadiDisney
        const apiUrl = `https://api.betabotz.eu.org/api/maker/jadidisney?apikey=${config.apikey.key}&url=${encodeURIComponent(uploadedUrl)}`;
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        const resultPath = path.join("tmp", `disney_${Date.now()}.jpg`);
        fs.writeFileSync(resultPath, response.data);

        await sock.sendMessage(remoteJid, {
            image: fs.readFileSync(resultPath),
            caption: `_✅ gambar berhasil diubah ke mode disney, maaf kalo hasilnya jelek!_`
        }, { quoted: message });

        fs.unlinkSync(mediaPath);
        fs.unlinkSync(resultPath);
    } catch (error) {
        console.error("❌ ERROR plugin todisney:", error);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ maaf, terjadi kesalahan saat memproses gambar."
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["todisney"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};