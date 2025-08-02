// Database sementara menggunakan objek
const DB_kuisislami = {};

/**
 * Menambahkan data pengguna ke database
 */
function addUser(remoteJid, data) {
    DB_kuisislami[remoteJid] = data;
}

/**
 * Menghapus data pengguna
 */
function removeUser(remoteJid) {
    if (DB_kuisislami[remoteJid]?.timer) {
        clearTimeout(DB_kuisislami[remoteJid].timer); // penting untuk clearTimeout
    }
    delete DB_kuisislami[remoteJid];
}

/**
 * Mendapatkan data pengguna
 */
function getData(remoteJid) {
    return DB_kuisislami[remoteJid] || null;
}

/**
 * Mengecek apakah user sedang bermain
 */
function isUserPlaying(remoteJid) {
    return Boolean(DB_kuisislami[remoteJid]);
}

/**
 * Mengecek jawaban user
 */
function checkAnswer(remoteJid, userAnswer) {
    const data = getData(remoteJid);
    if (!data) return false;
    return data.answer?.trim().toLowerCase() === userAnswer.trim().toLowerCase();
}

module.exports = {
    addUser,
    removeUser,
    getData,
    isUserPlaying,
    checkAnswer
};