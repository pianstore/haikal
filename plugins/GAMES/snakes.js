const prefix = ".";

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, message } = messageInfo;

    const helpText = `
╭── 🎲 *ular tangga bot manual*
│ 
│ 📌 *perintah dasar:*
│ 
│ ➕ *${prefix}join*
│     bergabung ke game
│ 
│ 🚀 *${prefix}start*
│     mulai permainan (min 2 pemain)
│ 
│ 🎲 *${prefix}gulir*
│     lempar dadu saat giliranmu
│ 
│ 📍 *${prefix}posisi*
│     cek posisi semua pemain
│ 
│ 🚪 *${prefix}keluar*
│     keluar dari permainan
│ 
│ ❌ *${prefix}stop*
│     bubarkan game (hanya pemain)
│ 
│ ℹ️ *${prefix}snakes*
│     menampilkan menu bantuan ini
│ 
├─📋 *aturan main:*
│ 
│ 🎯 tujuan: capai petak 100
│ 👥 max pemain: 10 orang
│ 🕒 timeout pemain: 15 detik
│ 🎲 dadu: 1-6 acak
│ 🪜 kena tangga: naik
│ 🐍 kena ular: turun
│ 🔁 lewat 100: mundur balik
│ 🏆 pemenang: hadiah 10000 money
│ 
╰───────────────────────╯
`;

    await sock.sendMessage(remoteJid, { text: helpText }, { quoted: message });
  },
  Commands: ["snakes"],
  OnlyPremium: false,
  OnlyOwner: false
};