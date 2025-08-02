const DATABASE = {};

module.exports = {
  getGame: (jid) => DATABASE[jid],
  setGame: (jid, data) => DATABASE[jid] = data,
  deleteGame: (jid) => delete DATABASE[jid],
  hasGame: (jid) => !!DATABASE[jid],
  db: DATABASE
};