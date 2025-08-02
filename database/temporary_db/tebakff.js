const DB_tebak_ff = {};

function addUser(remoteJid, data) {
    DB_tebak_ff[remoteJid] = data;
}

function removeUser(remoteJid) {
    delete DB_tebak_ff[remoteJid];
}

function getUser(remoteJid) {
    return DB_tebak_ff[remoteJid] || null;
}

function isUserPlaying(remoteJid) {
    return Boolean(DB_tebak_ff[remoteJid]);
}

module.exports = {
    DB_tebak_ff,
    addUser,
    removeUser,
    getUser,
    isUserPlaying,
};