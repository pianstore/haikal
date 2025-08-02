const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebakislami");
const { addUser, updateUser, findUser } = require("@lib/users");
const mess = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, fullText, message, sender } = messageInfo;

    if (!isUserPlaying(remoteJid)) return true;

    const data = getUser(remoteJid);
    const msgText = fullText.toLowerCase();

    // 🧠 Clue maksimal 2x
    if (msgText === "clue" || msgText.includes("clue")) {
        if (data.clueCount >= 2) {
            return sock.sendMessage(remoteJid, {
                text: "❗ Clue hanya bisa digunakan maksimal 2 kali.",
                quoted: message
            });
        }

        if (!data.hint.includes('×')) {
            return sock.sendMessage(remoteJid, {
                text: "✅ Semua huruf sudah terbuka!",
                quoted: message
            });
        }

        const indexes = [];
        for (let i = 0; i < data.hint.length; i++) {
            if (data.hint[i] === '×') indexes.push(i);
        }

        const randIndex = indexes[Math.floor(Math.random() * indexes.length)];
        const hintArray = data.hint.split('');
        hintArray[randIndex] = data.fullAnswer[randIndex];
        data.hint = hintArray.join('');
        data.clueCount++;

        return sock.sendMessage(remoteJid, {
            text: `💡 Clue ${data.clueCount}/2: ${data.hint}`,
            quoted: message
        });
    }

    // ❌ Menyerah
    if (msgText === "nyerah" || msgText.includes("nyerah")) {
        removeUser(remoteJid);
        if (data.timer) clearTimeout(data.timer);

        const msg = mess.game_handler.menyerah
            .replace('@answer', data.answer)
            .replace('@command', data.command);

        return sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
    }

    // ✅ Jawaban benar
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
    name: "Game Islami",
    priority: 10,
    process
};