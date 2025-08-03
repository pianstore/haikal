const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const config = require("@config");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

/* ────── Upload ke Uguu lalu fallback ke Catbox ────── */
async function uploadWithFallback(filePath) {
  try {
    const formUguu = new FormData();
    formUguu.append("files[]", fs.createReadStream(filePath));

    const resUguu = await axios.post("https://uguu.se/upload", formUguu, {
      headers: formUguu.getHeaders(),
    });

    const uguuUrl = resUguu.data?.files?.[0]?.url;
    if (uguuUrl?.startsWith("http")) return uguuUrl;
    console.warn("⚠️ Upload ke Uguu gagal, lanjut Catbox...");
  } catch (err) {
    console.warn("⚠️ Upload Uguu error:", err.message);
  }

  try {
    const formCatbox = new FormData();
    formCatbox.append("reqtype", "fileupload");
    formCatbox.append("fileToUpload", fs.createReadStream(filePath));

    const resCatbox = await axios.post("https://catbox.moe/user/api.php", formCatbox, {
      headers: formCatbox.getHeaders(),
    });

    if (typeof resCatbox.data === "string" && resCatbox.data.startsWith("http"))
      return resCatbox.data;

    throw new Error("Format respons Catbox tidak sesuai.");
  } catch (err) {
    console.error("❌ Upload Catbox gagal:", err.response?.data || err.message);
    throw new Error("Upload gagal ke semua layanan.");
  }
}

/* ────── Main Plugin ────── */
async function handle(sock, messageInfo) {
  const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

  try {
    if (!content) {
      return sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ *${prefix + command} Atas | Bawah*`,
        },
        { quoted: message }
      );
    }

    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    const mediaType = isQuoted ? isQuoted.type : type;
    if (mediaType !== "image" && mediaType !== "sticker") {
      return sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Kirim atau balas gambar dengan caption *${prefix + command}*_` },
        { quoted: message }
      );
    }

    const [text1 = "", text2 = ""] = (content || "").split("|");

    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);

    const mediaPath = path.join("tmp", media);
    if (!fs.existsSync(mediaPath)) throw new Error("File media tidak ditemukan setelah diunduh.");

    const imageUrl = await uploadWithFallback(mediaPath);
    if (!imageUrl.startsWith("http")) throw new Error("URL upload tidak valid.");

    const response = await axios.get("https://elrayyxml.vercel.app/maker/memegan", {
      responseType: "arraybuffer",
      params: {
        text_atas: text1.trim(),
        text_bawah: text2.trim(),
        background: imageUrl,
      },
    });

    const buffer = response.data;
    const webpBuffer = await sharp(buffer).webp().toBuffer();

    const stickerOptions = {
      packname: config.sticker_packname,
      author: config.sticker_author,
    };

    await sendImageAsSticker(sock, remoteJid, webpBuffer, stickerOptions, message);

    fs.unlinkSync(mediaPath); // bersihkan file setelah selesai
    await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

  } catch (err) {
    console.error(err);
    await sock.sendMessage(
      remoteJid,
      { text: `❌ Gagal memproses: ${err.message}` },
      { quoted: message }
    );
  }
}

/* ────── Ekspor Plugin ────── */
module.exports = {
  handle,
  Commands: ["smeme"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1,
};