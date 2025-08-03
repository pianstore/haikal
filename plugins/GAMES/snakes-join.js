const { getGame, setGame } = require('@lib/snakes-state');
const { sendMessageWithMention } = require("@lib/utils");

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, sender, message } = messageInfo;

    let game = getGame(remoteJid) || {
      players: [],
      started: false,
      turnIndex: 0,
      positions: {}
    };

    // Cek apakah pemain sudah join
    if (game.players.includes(sender)) {
      return sock.sendMessage(remoteJid, {
        text: '⚠️ kamu sudah bergabung dalam game ini.'
      }, { quoted: message });
    }

    // Batas maksimal pemain
    if (game.players.length >= 10) {
      return sock.sendMessage(remoteJid, {
        text: '🚫 maksimal 10 pemain sudah tercapai.'
      }, { quoted: message });
    }

    // Tambahkan pemain
    game.players.push(sender);
    game.positions[sender] = 1;
    setGame(remoteJid, game);

    const joinNote = game.started
      ? `⚠️ @${sender.split("@")[0]} bergabung *saat game sedang berjalan*! (posisi awal: 1)`
      : `✅ @${sender.split("@")[0]} berhasil bergabung ke dalam game snakes.`;

    await sendMessageWithMention(sock, remoteJid, joinNote, message);

    // 🔔 Opsional: Tampilkan giliran saat ini jika game sedang berjalan
    if (game.started) {
      const currentPlayer = game.players[game.turnIndex];
      await sendMessageWithMention(sock, remoteJid,
        `🎮 game sedang berlangsung.\n🔄 sekarang giliran: @${currentPlayer.split("@")[0]}`,
        message);
    }
  },
  Commands: ["join"],
  OnlyPremium: false,
  OnlyOwner: false
};