const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tekateki");
const { addUser, updateUser, findUser } = require("@lib/users");
const mess = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, fullText, message, sender } = messageInfo;

    if (!isUserPlaying(remoteJid)) return true;

    const data = getUser(remoteJid);
    const msgText = fullText.toLowerCase();

    // 🔍 CLUE
    if (msgText === "clue") {
        if (data.clueCount >= 2) {
            return sock.sendMessage(remoteJid, {
                text: "❗ clue hanya bisa digunakan maksimal 2 kali.",
                quoted: message
            });
        }

        if (!data.hint.includes('×')) {
            return sock.sendMessage(remoteJid, {
                text: "✅ semua huruf sudah terbuka!",
                quoted: message
            });
        }

        // Buka huruf acak yang masih tersembunyi
        const indexes = [];
        for (let i = 0; i < data.hint.length; i++) {
            if (data.hint[i] === '×') indexes.push(i);
        }

        const randIndex = indexes[Math.floor(Math.random() * indexes.length)];
        const hintArray = data.hint.split('');
        hintArray[randIndex] = data.fullAnswer[randIndex];
        data.hint = hintArray.join('');
        data.clueCount++;

        const clueMsg = {
            text: `💡clue ${data.clueCount}/2: ${data.hint}`,
            quoted: message
        };

        // Jika clue masih bisa dipakai, tampilkan tombol
        if (data.clueCount < 2 && data.hint.includes('×')) {
            clueMsg.buttons = [
                { buttonId: "clue", buttonText: { displayText: "clue" }, type: 1 }
            ];
            clueMsg.footer = "tekan tombol untuk petunjuk tambahan";
        }

        return sock.sendMessage(remoteJid, clueMsg);
    }

    // ❌ NYERAH
    if (msgText === "nyerah") {
        removeUser(remoteJid);
        if (data.timer) clearTimeout(data.timer);

        const msg = mess.game_handler.menyerah
            .replace('@answer', data.answer)
            .replace('@command', data.command);

        return sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
    }

    // ✅ JAWABAN BENAR
    if (msgText === data.answer) {
        const hadiah = data.hadiah;
        const user = await findUser(sender);

        if (user) {
            await updateUser(sender, { money: (user.money || 0) + hadiah });
        } else {
            await addUser(sender, {
                money: hadiah,
                role: "user",
                status: "active"
            });
        }

        if (data.timer) clearTimeout(data.timer);
        removeUser(remoteJid);

        const msg = mess.game_handler.tebak_kata.replace('@hadiah', hadiah);
        return sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
    }

    return true;
}

module.exports = {
    name: "Game Tekateki",
    priority: 10,
    process
};