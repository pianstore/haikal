const { getGame, setGame, deleteGame } = require('@lib/snakes-state');
const { getBuffer, sendMessageWithMention, sendImagesWithMention } = require("@lib/utils");
const { findUser, updateUser, addUser } = require("@lib/users");
const { getProfilePictureUrl } = require("@lib/cache");
const { kirimSticker } = require('@lib/snakes-utils');
const { setTurnTimeout, clearTurnTimeout } = require('@lib/snakes-timeout');

const snakes = { 99: 41, 95: 76, 89: 53, 66: 45, 54: 31, 43: 17, 40: 2, 27: 5 };
const ladders = { 4: 23, 13: 46, 33: 52, 42: 63, 50: 69, 62: 81, 74: 93 };
const MONEY_MENANG = 10000;
const WAKTU_GILIRAN = 15000;

let pendingDelete = null;

module.exports = {
  handle: async (sock, messageInfo) => {
    const { remoteJid, sender, message } = messageInfo;
    const game = getGame(remoteJid);

    if (!game || !game.started) {
      return sock.sendMessage(remoteJid, {
        text: '❌ *game belum dimulai.*\nketik *.join* untuk bergabung dan *.start* untuk memulai permainan.'
      }, { quoted: message });
    }

    if (game.players[game.turnIndex] !== sender) {
      return sendMessageWithMention(sock, remoteJid, `🔄 *bukan giliranmu!*\nsekarang giliran: @${game.players[game.turnIndex].split("@")[0]}`, message);
    }

    clearTurnTimeout(remoteJid); // Bersihkan timeout lama

    const dice = Math.floor(Math.random() * 6) + 1;
    let pos = game.positions[sender] + dice;
    if (pos > 100) pos = 100 - (pos - 100);

    let info = '';
    if (snakes[pos]) {
      info = `🐍 *peristiwa:* ups! kena ular, turun ke ${snakes[pos]}`;
      pos = snakes[pos];
    } else if (ladders[pos]) {
      info = `🪜 *peristiwa:* naik tangga! meloncat ke ${ladders[pos]}`;
      pos = ladders[pos];
    } else {
      info = `✅ *status:* aman`;
    }

    game.positions[sender] = pos;

    if (pos === 100) {
      clearTurnTimeout(remoteJid);
      deleteGame(remoteJid);

      const user = await findUser(sender);
      if (user) {
        await updateUser(sender, { money: (user.money || 0) + MONEY_MENANG });
      } else {
        await addUser(sender, { money: MONEY_MENANG, role: "user", status: "active" });
      }

      return sendMessageWithMention(sock, remoteJid,
        `🎉🎊 *KEMENANGAN!* 🎊🎉\n\n` +
        `🏆 *@${sender.split("@")[0]}* mencapai kotak 100!\n` +
        `💰 hadiah: \`+${MONEY_MENANG} money\`\n\n` +
        `ketik *.join* untuk ronde baru.`,
        message);
    }

    game.turnIndex = (game.turnIndex + 1) % game.players.length;
    setGame(remoteJid, game);

    const params = new URLSearchParams();
    for (let player of game.players) {
      const pp = await getProfilePictureUrl(sock, player);
      params.append('pp', pp);
      params.append('positions', game.positions[player] || 1);
    }

    const API_URL = `https://api.autoresbot.com/api/maker/ulartangga?${params.toString()}`;

    try {
      await kirimSticker(sock, remoteJid, `${dice}.webp`, message);
      const buffer = await getBuffer(API_URL);

      const teks =
        `*🎲 GILIRAN BERMAIN!*\n\n` +
        `👤 *pemain:* @${sender.split("@")[0]}\n` +
        `🎯 *angka dadu:* 🎲 *${dice}*\n` +
        `📍 *posisi baru:* *${pos}*\n` +
        `${info}\n\n` +
        `🔁 *giliran berikutnya:* @${game.players[game.turnIndex].split("@")[0]}`;

      const result = await sendImagesWithMention(sock, remoteJid, buffer, teks, message);

      if (result && pendingDelete) {
        await sock.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: true,
            id: pendingDelete
          }
        });
      }

      pendingDelete = result?.key?.id;

      const nextTurn = game.players[game.turnIndex];
      setTurnTimeout(remoteJid, setTimeout(async function timeoutLoop() {
        clearTurnTimeout(remoteJid);

        await sendMessageWithMention(sock, remoteJid,
          `⏱️ *giliran @${nextTurn.split("@")[0]} dilewati*\nKarena tidak bermain dalam 15 detik.`,
          message);

        game.turnIndex = (game.turnIndex + 1) % game.players.length;
        setGame(remoteJid, game);

        const autoNext = game.players[game.turnIndex];
        await sendMessageWithMention(sock, remoteJid,
          `➡️ *giliran selanjutnya:* @${autoNext.split("@")[0]}`,
          message);

        setTurnTimeout(remoteJid, setTimeout(timeoutLoop, WAKTU_GILIRAN));
      }, WAKTU_GILIRAN));

    } catch (err) {
      console.error(err);
      await sock.sendMessage(remoteJid, {
        text: `❌ *gagal mengambil papan dari API.*\n➡️ giliran: @${game.players[game.turnIndex].split("@")[0]}`
      }, { quoted: message });
    }
  },
  Commands: ["gulir"],
  OnlyPremium: false,
  OnlyOwner: false
};