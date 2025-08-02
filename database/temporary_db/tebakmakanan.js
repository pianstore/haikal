const DB_tebak_makanan = {};

function addUser(remoteJid, data) {
    DB_tebak_makanan[remoteJid] = data;
}

function removeUser(remoteJid) {
    delete DB_tebak_makanan[remoteJid];
}

function getUser(remoteJid) {
    return DB_tebak_makanan[remoteJid] || null;
}

function isUserPlaying(remoteJid) {
    return Boolean(DB_tebak_makanan[remoteJid]);
}

module.exports = {
    DB_tebak_makanan,
    addUser,
    removeUser,
    getUser,
    isUserPlaying,
};