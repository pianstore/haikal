const { removeUser, getData, isUserPlaying, checkAnswer } = require("@tmpDB/kuisislami");
const { addUser, updateUser, findUser } = require("@lib/users");
const mess = require("@mess");

async function process(sock, messageInfo) {
    const { remoteJid, fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getData(remoteJid);
        const answer = fullText.trim().toLowerCase();

        // ✅ Jika user menyerah
        if (answer.includes("nyerah")) {
            if (data?.timer) clearTimeout(data.timer);
            removeUser(remoteJid);

            const menyerahMsg = mess.game_handler?.menyerah
                ?.replace('@answer', data.answer)
                ?.replace('@command', data.command) || "😔 Kamu menyerah. Jawaban yang benar adalah: " + data.answer;

            return await sock.sendMessage(remoteJid, { text: menyerahMsg }, { quoted: message });
        }

        // ✅ Jika jawaban benar
        if (checkAnswer(remoteJid, answer)) {
            const hadiah = data.hadiah;
            const rewardMoney = Math.round(hadiah * 0.6);
            const rewardLimit = Math.round(hadiah * 0.4);

            const user = await findUser(sender);
            if (user) {
                await updateUser(sender, {
                    money: (user.money || 0) + rewardMoney,
                    limit: (user.limit || 0) + rewardLimit
                });
            } else {
                await addUser(sender, {
                    money: rewardMoney,
                    limit: rewardLimit,
                    role: "user",
                    status: "active"
                });
            }

            if (data?.timer) clearTimeout(data.timer);
            removeUser(remoteJid);

            const winMessage = mess.game_handler?.kuisislami
                ?.replace('@money', rewardMoney)
                ?.replace('@limit', rewardLimit)
                ?.replace('@deskripsi', data.deskripsi)
                || `✅ Jawaban benar!\n\n📖 ${data.deskripsi}\n🎁 Hadiah: +${rewardMoney} money & +${rewardLimit} limit`;

            await sock.sendMessage(remoteJid, { text: winMessage }, { quoted: message });

            return false;
        } else {
            // ❌ Jawaban salah (hanya reaksi emoji)
            await sock.sendMessage(remoteJid, {
                react: {
                    text: "❌",
                    key: message.key
                }
            });
            return false;
        }
    }

    return true; // Jika tidak sedang main, lanjut ke plugin berikutnya
}

module.exports = {
    name: "Kuis Islami",
    priority: 10,
    process,
};