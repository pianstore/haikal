const { getGame } = require('@lib/snakes-state');
const { sendMessageWithMention } = require("@lib/utils");

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, message } = messageInfo;
    const game = getGame(remoteJid);

    if (!game || !game.started) {
      return sock.sendMessage(remoteJid, {
        text: '❌ tidak ada game yang sedang berjalan.'
      }, { quoted: message });
    }

    const posisiList = game.players.map((player, i) => {
      const pos = game.positions[player] || 1;
      const isTurn = i === game.turnIndex ? ' 🔄' : '';
      return `• @${player.split("@")[0]} → ${pos}${isTurn}`;
    }).join('\n');

    const currentPlayer = game.players[game.turnIndex];
    const giliran = `Giliran saat ini: @${currentPlayer.split('@')[0]}`;

    const text = `📊 *Status Permainan Ular Tangga*\n\n${posisiList}\n\n${giliran}`;

    await sendMessageWithMention(sock, remoteJid, text, message);
  },
  Commands: ["posisi"],
  OnlyPremium: false,
  OnlyOwner: false
};