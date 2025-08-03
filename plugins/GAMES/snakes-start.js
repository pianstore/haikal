const { getGame, setGame } = require('@lib/snakes-state');
const { sendMessageWithMention } = require("@lib/utils");
const { setTurnTimeout, clearTurnTimeout } = require('@lib/snakes-timeout');

const WAKTU_GILIRAN = 15000; // 10 detik timeout per giliran

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, message } = messageInfo;
    const game = getGame(remoteJid);

    if (!game) {
      return sock.sendMessage(remoteJid, {
        text: '❌ belum ada game, ketik *.join* untuk masuk ke dalam pemain'
      }, { quoted: message });
    }

    if (game.started) {
      return sock.sendMessage(remoteJid, {
        text: '🟡 game sudah dimulai.'
      }, { quoted: message });
    }

    if (game.players.length < 2) {
      return sock.sendMessage(remoteJid, {
        text: '❌ minimal 2 pemain.'
      }, { quoted: message });
    }

    // Mulai game
    game.started = true;
    game.turnIndex = 0;
    setGame(remoteJid, game);

    const giliranPertama = game.players[0];

    // ⏱️ Aktifkan timeout giliran pertama
    setTurnTimeout(remoteJid, setTimeout(async function timeoutLoop() {
      clearTurnTimeout(remoteJid);

      await sendMessageWithMention(sock, remoteJid,
        `⏱️ *giliran @${giliranPertama.split("@")[0]} dilewati*\nkarena tidak bermain dalam 15 detik.`,
        message);

      game.turnIndex = (game.turnIndex + 1) % game.players.length;
      setGame(remoteJid, game);

      const nextPlayer = game.players[game.turnIndex];
      await sendMessageWithMention(sock, remoteJid,
        `➡️ *giliran selanjutnya:* @${nextPlayer.split("@")[0]}`,
        message);

      setTurnTimeout(remoteJid, setTimeout(timeoutLoop, WAKTU_GILIRAN));
    }, WAKTU_GILIRAN));

    // 🎲 Info giliran pertama
    await sendMessageWithMention(sock, remoteJid,
      `🎲 *game dimulai!*\ngiliran pertama: @${giliranPertama.split("@")[0]}\nketik *.gulir* untuk melempar dadu.`,
      message);
  },
  Commands: ["start"],
  OnlyPremium: false,
  OnlyOwner: false
};