const { getGame, hasGame, deleteGame } = require('@lib/snakes-state');
const { sendMessageWithMention } = require("@lib/utils");
const { clearTurnTimeout } = require('@lib/snakes-timeout');

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, sender, message } = messageInfo;

    if (!hasGame(remoteJid)) {
      return sock.sendMessage(remoteJid, {
        text: '⚠️ tidak ada game yang sedang berjalan.'
      }, { quoted: message });
    }

    const game = getGame(remoteJid);

    if (!game.players.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: '❌ hanya pemain yang sudah join yang bisa membubarkan game.'
      }, { quoted: message });
    }

    clearTurnTimeout(remoteJid); // 🧹 bersihkan timeout giliran aktif
    deleteGame(remoteJid);

    return await sendMessageWithMention(sock, remoteJid,
      `🛑 game telah dibubarkan oleh @${sender.split("@")[0]}`,
      message);
  },
  Commands: ["stop"],
  OnlyPremium: false,
  OnlyOwner: false
};