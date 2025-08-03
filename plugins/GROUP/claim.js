const { findUser, updateUser, addUser } = require("@lib/users");
const { formatRemainingTime } = require("@lib/utils");

const ownerJids = [
    "6285256833258@s.whatsapp.net",
    "628891768169@s.whatsapp.net"
];

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    const CLAIM_COOLDOWN_MINUTES = 1000;
    const currentTime = Date.now();
    const CLAIM_COOLDOWN = CLAIM_COOLDOWN_MINUTES * 60 * 800;

    const isOwner = ownerJids.includes(sender);

    const MoneyClaim = isOwner
        ? Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000
        : Math.floor(Math.random() * (15 - 5 + 1)) + 5;

    const LimitClaim = isOwner
        ? Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000
        : Math.floor(Math.random() * (15 - 5 + 1)) + 5;

    const dataUsers = await findUser(sender);
    if (dataUsers) {
        if (!isOwner && dataUsers.lastClaim && currentTime - dataUsers.lastClaim < CLAIM_COOLDOWN) {
            const remainingTime = Math.floor((CLAIM_COOLDOWN - (currentTime - dataUsers.lastClaim)) / 1000);
            const formattedTime = formatRemainingTime(remainingTime);
            return await sock.sendMessage(
                remoteJid,
                {
                    text:
`╭── ⏳ ᴄʟᴀɪᴍ ᴅɪᴛᴏʟᴀᴋ
│ ᴋᴀᴍᴜ sᴜᴅᴀʜ ᴋʟᴀɪᴍ sᴇʙᴇʟᴜᴍɴʏᴀ
│ sɪʟᴀᴋᴀɴ ᴛᴜɴɢɢᴜ: ${formattedTime}
╰──────────────────────────`
                },
                { quoted: message }
            );
        }

        await updateUser(sender, {
            money: dataUsers.money + MoneyClaim,
            limit: dataUsers.limit + LimitClaim,
            lastClaim: isOwner ? dataUsers.lastClaim : currentTime
        });

        const updatedUser = await findUser(sender);
        return await sock.sendMessage(
            remoteJid,
            {
                text:
`╭── ✅ ᴄʟᴀɪᴍ ʙᴇʀʜᴀsɪʟ
│ + ᴍᴏɴᴇʏ : ${MoneyClaim}
│ + ʟɪᴍɪᴛ : ${LimitClaim}
│
│ ᴛᴏᴛᴀʟ sᴀᴀᴛ ɪɴɪ:
│ • ᴍᴏɴᴇʏ : ${updatedUser.money}
│ • ʟɪᴍɪᴛ : ${updatedUser.limit}
╰─────────────────────`
            },
            { quoted: message }
        );
    } else {
        await addUser(sender, {
            money: MoneyClaim,
            limit: LimitClaim,
            role: isOwner ? "owner" : "user",
            status: "active",
            lastClaim: isOwner ? 0 : currentTime
        });

        return await sock.sendMessage(
            remoteJid,
            {
                text:
`╭── 🆕 ᴘᴇɴɢɢᴜɴᴀ ʙᴀʀᴜ
│ + ᴍᴏɴᴇʏ : ${MoneyClaim}
│ + ʟɪᴍɪᴛ : ${LimitClaim}
│
│ sɪʟᴀᴋᴀɴ ɢᴜɴᴀᴋᴀɴ ᴘᴇʀɪɴᴛᴀʜ ʟᴀɪɴɴʏᴀ
╰─────────────────────────`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['claim'],
    OnlyPremium: false,
    OnlyOwner: false
};