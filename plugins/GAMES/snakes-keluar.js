const { getGame, setGame, deleteGame } = require('@lib/snakes-state');
const { sendMessageWithMention } = require("@lib/utils");
const { setTurnTimeout, clearTurnTimeout } = require('@lib/snakes-timeout');

const WAKTU_GILIRAN = 15000; // 10 detik timeout

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, sender, message } = messageInfo;
    let game = getGame(remoteJid);

    if (!game || !game.players.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: '❌ kamu tidak sedang ikut game.'
      }, { quoted: message });
    }

    const keluarIndex = game.players.indexOf(sender);
    const isCurrentTurn = game.turnIndex === keluarIndex;

    // Hapus pemain dari daftar
    game.players.splice(keluarIndex, 1);
    delete game.positions[sender];

    // Update giliran
    if (game.turnIndex >= game.players.length) {
      game.turnIndex = 0;
    } else if (keluarIndex < game.turnIndex) {
      game.turnIndex -= 1;
    }

    // Jika tinggal satu pemain, bubarkan game
    if (game.players.length < 2) {
      clearTurnTimeout(remoteJid);
      deleteGame(remoteJid);
      return await sendMessageWithMention(
        sock,
        remoteJid,
        `🚪 @${sender.split("@")[0]} keluar.\n❌ *game dihentikan karena pemain kurang dari 2.*`,
        message
      );
    }

    // Simpan perubahan game
    setGame(remoteJid, game);

    // 🧹 Bersihkan timeout giliran jika yang keluar adalah pemain yang sedang giliran
    if (isCurrentTurn) {
      clearTurnTimeout(remoteJid);

      const giliranBaru = game.players[game.turnIndex];
      await sendMessageWithMention(sock, remoteJid,
        `🚪 @${sender.split("@")[0]} keluar dari game.\n🎮 *giliran selanjutnya:* @${giliranBaru.split("@")[0]}`,
        message);

      // 🔁 Aktifkan timeout giliran baru
      setTurnTimeout(remoteJid, setTimeout(async function timeoutLoop() {
        clearTurnTimeout(remoteJid);

        game.turnIndex = (game.turnIndex + 1) % game.players.length;
        setGame(remoteJid, game);

        const nextPlayer = game.players[game.turnIndex];
        await sendMessageWithMention(sock, remoteJid,
          `⏱️ *giliran @${giliranBaru.split("@")[0]} dilewati.*\n➡️ giliran berikutnya: @${nextPlayer.split("@")[0]}`,
          message);

        setTurnTimeout(remoteJid, setTimeout(timeoutLoop, WAKTU_GILIRAN));
      }, WAKTU_GILIRAN));

    } else {
      // Jika bukan giliran yang keluar
      const giliran = game.players[game.turnIndex];
      await sendMessageWithMention(sock, remoteJid,
        `🚪 @${sender.split("@")[0]} keluar dari game.\n🎮 giliran tetap: @${giliran.split("@")[0]}`,
        message);
    }
  },
  Commands: ["keluar"],
  OnlyPremium: false,
  OnlyOwner: false
};