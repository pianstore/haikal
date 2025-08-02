const { findAbsen } = require("@lib/absen");
const { sendMessageWithMention } = require('@lib/utils');
const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const totalMembers = participants.length;

        const data = await findAbsen(remoteJid);

        let textNotif;

        if (data && data.member.length > 0) {
            const absenteesCount = data.member.length;
            const remainingCount = totalMembers - absenteesCount;

            const memberList = data.member
                .map((member, index) => `│  ${index + 1}. @${member.split('@')[0]}`)
                .join('\n');

            textNotif =
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃     *ᴅᴀꜰᴛᴀʀ ᴀʙꜱᴇɴ ʜᴀʀɪ ɪɴɪ*     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫
${memberList}
┣━━━━━━━━━━━━━━━━━━━━━━━┫
│  ✔️ ᴛᴇʟᴀʜ ᴀʙꜱᴇɴ : *${absenteesCount}*
│  ⏳ ʙᴇʟᴜᴍ ᴀʙꜱᴇɴ : *${remainingCount}*
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;
        } else {
            textNotif =
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃     *ᴅᴀꜰᴛᴀʀ ᴀʙꜱᴇɴ ʜᴀʀɪ ɪɴɪ*     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫
│  ⚠️ ʙᴇʟᴜᴍ ᴀᴅᴀ ʏᴀɴɢ ᴀʙꜱᴇɴ.
│  ⏳ ʙᴇʟᴜᴍ ᴀʙꜱᴇɴ : *${totalMembers}*
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;
        }

        await sendMessageWithMention(sock, remoteJid, textNotif, message);

    } catch (error) {
        console.error('Error handling listabsen:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ ᴛᴇʀᴊᴀᴅɪ ᴋᴇꜱᴀʟᴀʜᴀɴ ꜱᴀᴀᴛ ᴍᴇɴᴀᴍᴘɪʟᴋᴀɴ ᴅᴀꜰᴛᴀʀ ᴀʙꜱᴇɴ.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['listabsen'],
    OnlyPremium: false,
    OnlyOwner: false
};