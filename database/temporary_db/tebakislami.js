const db = {};

function addUser(remoteJid, data) {
    db[remoteJid] = {
        ...data,
        startedAt: Date.now()
    };
}

function getUser(remoteJid) {
    return db[remoteJid] || null;
}

function isUserPlaying(remoteJid) {
    return db.hasOwnProperty(remoteJid);
}

function removeUser(remoteJid) {
    if (db[remoteJid]) {
        clearTimeout(db[remoteJid].timer);
        delete db[remoteJid];
    }
}

module.exports = {
    addUser,
    getUser,
    isUserPlaying,
    removeUser
};