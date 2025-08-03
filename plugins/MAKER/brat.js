const config = require("@config");
const axios = require("axios");
const { sendImageAsSticker } = require("@lib/exif");
const { logCustom } = require("@lib/logger");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");

/* ────── Upload ke Uguu lalu fallback ke Catbox ────── */
async function uploadWithFallback(filePath) {
  try {
    const formUguu = new FormData();
    formUguu.append('files[]', fs.createReadStream(filePath));

    const responseUguu = await axios.post('https://uguu.se/upload', formUguu, {
      headers: { ...formUguu.getHeaders() }
    });

    const uguuUrl = responseUguu.data?.files?.[0]?.url;
    if (uguuUrl?.startsWith("http")) return uguuUrl;

    console.warn("⚠️ Upload ke Uguu gagal, coba Catbox...");
  } catch (err) {
    console.warn("⚠️ Upload ke Uguu error:", err.message);
  }

  try {
    const formCatbox = new FormData();
    formCatbox.append('reqtype', 'fileupload');
    formCatbox.append('fileToUpload', fs.createReadStream(filePath));

    const responseCatbox = await axios.post('https://catbox.moe/user/api.php', formCatbox, {
      headers: { ...formCatbox.getHeaders() }
    });

    if (typeof responseCatbox.data === 'string' && responseCatbox.data.startsWith("http"))
      return responseCatbox.data;

    throw new Error("Format respons Catbox tidak sesuai.");
  } catch (error) {
    console.error("❌ Upload ke Catbox gagal:", error.response?.data || error.message);
    throw new Error("Upload gagal ke semua layanan.");
  }
}

/* ────── Main handler ────── */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

  try {
    const text = content?.trim() !== "" ? content : isQuoted?.text ?? null;
    if (!text) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} ʜᴀɪᴋᴀʟ*_`,
        },
        { quoted: message }
      );
    }

    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    // Ambil gambar dari API brat
    const bratUrl = `https://elrayyxml.vercel.app/maker/brat?text=${encodeURIComponent(text.replace(/\n+/g, " "))}`;
    const bratRes = await axios.get(bratUrl, { responseType: "arraybuffer" });

    if (bratRes.status !== 200) throw new Error("Gagal mengambil gambar brat");

    const tmpDir = "./tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const tmpPath = path.join(tmpDir, `brat_${Date.now()}.jpg`);
    await fs.promises.writeFile(tmpPath, bratRes.data);

    // Upload ke Uguu → fallback Catbox
    const imageUrl = await uploadWithFallback(tmpPath);
    if (!imageUrl.startsWith("http")) throw new Error("URL dari unggahan tidak valid");

    // Proses Remini HD
    const { data: reminiJson } = await axios.get(
      `https://elrayyxml.vercel.app/image/remini?url=${encodeURIComponent(imageUrl)}`
    );

    if (!reminiJson?.status || !reminiJson?.result)
      throw new Error("Respons Remini tidak valid");

    const { data: hdBuffer } = await axios.get(reminiJson.result, {
      responseType: "arraybuffer"
    });

    // Kirim sebagai stiker
    await sendImageAsSticker(
      sock,
      remoteJid,
      hdBuffer,
      {
        packname: config.sticker_packname,
        author: config.sticker_author
      },
      message
    );

    fs.unlinkSync(tmpPath);
    await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

  } catch (err) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    await sock.sendMessage(
      remoteJid,
      { text: `❌ Gagal memproses:\n${err.message}` },
      { quoted: message }
    );
  }
}

/* ────── Export ────── */
module.exports = {
  handle,
  Commands: ["brat"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 2
};