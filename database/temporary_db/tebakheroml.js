const DB_tebak_hero = {};

function addUser(remoteJid, data) {
    DB_tebak_hero[remoteJid] = data;
}

function removeUser(remoteJid) {
    delete DB_tebak_hero[remoteJid];
}

function getUser(remoteJid) {
    return DB_tebak_hero[remoteJid] || null;
}

function isUserPlaying(remoteJid) {
    return Boolean(DB_tebak_hero[remoteJid]);
}

module.exports = {
    DB_tebak_hero,
    addUser,
    removeUser,
    getUser,
    isUserPlaying,
};