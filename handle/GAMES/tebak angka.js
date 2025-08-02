const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak angka");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");
const mess                      = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // Ketika menyerah
        if(fullText.toLowerCase().includes('nyerah')){
            removeUser(remoteJid);
            if (data && data.timer) {
                clearTimeout(data.timer);
            }
      
            if(mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                .replace('@answer', data.angkaAcak)
                .replace('@command', data.command);

                await sock.sendMessage(remoteJid, {
                    text: messageWarning,
                }, { quoted: message });
            }

            return false;
        }

        if (!/^\d+$/.test(fullText)) {
            // Input bukan angka, diabaikan.
            return;
        }

        const guessedNumber = parseInt(fullText, 10);

        if (guessedNumber === data.angkaAcak) {
            const hadiah = data.hadiah;

            // Mencari pengguna
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah; // Default money ke 0 jika undefined
                await updateUser(sender, { money: moneyAdd });
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }
            removeUser(remoteJid);
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

            if(mess.game_handler.tebak_angka) {
                const messageNotif = mess.game_handler.tebak_angka
                .replace('@hadiah', hadiah);
                await sock.sendMessage(remoteJid, {
                    text: messageNotif,
                }, { quoted: message });
            }


            return false;
        } else {
            data.attempts -= 1;
            const hint =
                guessedNumber < data.angkaAcak
                    ? `❗ Angka ${guessedNumber} terlalu kecil.`
                    : `❗ Angka ${guessedNumber} terlalu besar.`;

            await sock.sendMessage(remoteJid, {
                text: `${hint} Sisa Percobaan : ${data.attempts}.`,
            }, { quoted: message });


            if (data.attempts <= 0) {
                if (data && data.timer) {
                 clearTimeout(data.timer);
                }
                removeUser(remoteJid);
                await sock.sendMessage(remoteJid, {
                    text: "❌ Sisa Percobaan habis. Game selesai.",
                }, { quoted: message });
            }
            return false;
        }

        return true; // Lanjutkan ke plugin berikutnya
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name: "Tebak Angka",
    priority : 10,
    process,
};
