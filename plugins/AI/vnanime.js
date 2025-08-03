const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { downloadToBuffer } = require("@lib/utils");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, isQuoted } =
    messageInfo;

  // Ambil teks yang dikirim atau teks dari pesan yang dikutip
  const text = content?.trim() || isQuoted?.text?.trim() || null;

  // Validasi input
  if (!text || text.length < 1) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix}${command} halo google*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Kirim reaksi proses
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Panggil API
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get("/api/sound/textanime", { text });

    if (response?.data) {
      // Download hasil API ke buffer
      const audioBuffer = await downloadToBuffer(response.data, "mp4");

      // Kirim sebagai audio PTT
      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
          ptt: true,
        },
        { quoted: message }
      );
    } else {
      throw new Error("Respon API kosong atau tidak sesuai.");
    }
  } catch (error) {
    // Log error ke file
    logCustom("error", text, `ERROR-COMMAND-${command}.txt`);
    console.error("⚠️ Terjadi kesalahan:", error);

    await sock.sendMessage(
      remoteJid,
      {
        text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n_${error.message}_`,
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["vnanime"],
  OnlyPremium: false,
  OnlyOwner: false,
};
