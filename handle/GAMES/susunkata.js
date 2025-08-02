const { removeUser, getUser, isUserPlaying } = require("@tmpDB/susunkata");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");
const mess = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // Menyerah
        if (fullText.toLowerCase().includes('nyerah')) {
            removeUser(remoteJid);
            if (data && data.timer) clearTimeout(data.timer);

            if (mess.game_handler.menyerah) {
                const msg = mess.game_handler.menyerah
                    .replace('@answer', data.answer)
                    .replace('@command', data.command);

                await sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
            }
            return false;
        }

        // Jika jawaban benar
        if (fullText.toLowerCase() === data.answer) {
            const hadiah = data.hadiah;

            const user = await findUser(sender);
            if (user) {
                const moneyAdd = (user.money || 0) + hadiah;
                await updateUser(sender, { money: moneyAdd });
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active"
                });
            }

            if (data.timer) clearTimeout(data.timer);
            removeUser(remoteJid);

            if (mess.game_handler.tebak_kata) {
                const msg = mess.game_handler.tebak_kata
                    .replace('@hadiah', hadiah);
                await sock.sendMessage(remoteJid, { text: msg }, { quoted: message });
            }
            return false;
        }
    }

    return true; // lanjut ke plugin lain
}

module.exports = {
    name: "Susun Kata",
    priority: 10,
    process
};