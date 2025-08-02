const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebakheroml");
const { addUser, updateUser, findUser } = require("@lib/users");
const mess = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // 🔍 DEBUG UNTUK CEK JAWABAN
        console.log('\n===== [DEBUG - Tebak Hero] =====');
        console.log('fullText:', `"${fullText}"`);
        console.log('expected answer:', `"${data?.answer}"`);
        console.log('command:', `"${data?.command}"`);
        console.log('cocok:', fullText?.toLowerCase().trim() === data?.answer?.toLowerCase().trim());
        console.log('================================\n');

        if (!data || typeof data.answer !== 'string') {
            removeUser(remoteJid);
            return await sock.sendMessage(remoteJid, {
                text: "⚠️ Game error: jawaban tidak ditemukan.",
            }, { quoted: message });
        }

        // Pemain menyerah
        if (fullText.toLowerCase().includes('nyerah')) {
            if (data.timer) clearTimeout(data.timer);
            removeUser(remoteJid);

            if (mess.game_handler?.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                    .replace('@answer', data.answer)
                    .replace('@command', data.command);
                await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
            }
            return false;
        }

        // Jawaban benar
        const cleanAnswer = data.answer?.toLowerCase().trim();
        const cleanText = fullText?.toLowerCase().trim();

        if (cleanText === cleanAnswer) {
            const hadiah = data.hadiah;
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah;
                await updateUser(sender, { money: moneyAdd });
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            if (data.timer) clearTimeout(data.timer);
            removeUser(remoteJid);

            const messageNotif = (mess.game_handler?.tebak_hero || 
                `🎉 Jawaban benar! Kamu mendapatkan ${hadiah} money!`)
                .replace('@hadiah', hadiah);

            await sock.sendMessage(remoteJid, { text: messageNotif }, { quoted: message });

            return false;
        }
    }

    return true;
}

module.exports = {
    name: "Tebak Hero ML",
    priority: 10,
    process,
};