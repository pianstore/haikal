const fetch = require('node-fetch');
const config = require('@config');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_ᴍᴀꜱᴜᴋᴋᴀɴ ɪᴅ ɢᴀᴍᴇ_\n\n${prefix + command} 1374201203` },
                { quoted: message }
            );
        }

        const user_id = trimmedContent;

        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const url = `https://zenzxz.dpdns.org/stalker/freefire?uid=${user_id}&region=ID&media=true`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json?.status || !json?.success || !json?.data) {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ ᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴀᴛᴀᴜ ᴜɪᴅ ꜱᴀʟᴀʜ.' },
                { quoted: message }
            );
        }

        const { account, pet, profile, social, creditScore, images } = json.data;

        const resultText = `🎮 | *ꜰʀᴇᴇ ꜰɪʀᴇ ᴘʀᴏꜰɪʟᴇ*

◧ *ɴɪᴄᴋɴᴀᴍᴇ*        : ${account.nickname}
◧ *ᴜꜱᴇʀ ɪᴅ*         : ${account.accountId}
◧ *ʀᴇɢɪᴏɴ*          : ${account.region}
◧ *ʟᴇᴠᴇʟ*           : ${account.level}
◧ *ʟɪᴋᴇꜱ*           : ${account.likes}
◧ *ᴇxᴘ*             : ${account.exp}
◧ *ʀᴀɴᴋ*            : ${account.rank}
◧ *ᴍᴀx ʀᴀɴᴋ*        : ${account.maxRank}
◧ *ᴄʟᴀꜱʜ ꜱQᴜᴀᴅ ʀᴀɴᴋ* : ${account.csRank}
◧ *ʀᴀɴᴋɪɴɢ ᴘᴏɪɴᴛꜱ*  : ${account.rankingPoints}
◧ *ʀᴇʟᴇᴀꜱᴇ ᴠᴇʀꜱɪᴏɴ* : ${account.releaseVersion}
◧ *ꜱᴇᴀꜱᴏɴ ɪᴅ*       : ${account.seasonId}
◧ *ᴘʀɪᴍᴇ ʟᴇᴠᴇʟ*     : ${account.primeLevel}
◧ *ᴅɪᴀᴍᴏɴᴅ ᴄᴏꜱᴛ*    : ${account.diamondCost}
◧ *ᴛᴀɴɢɢᴀʟ ᴅɪʙᴜᴀᴛ*  : ${account.createdAt}
◧ *ʟᴀꜱᴛ ʟᴏɢɪɴ*      : ${account.lastLogin}

🐾 | *ᴘᴇᴛ ɪɴꜰᴏ*
◧ *ɴᴀᴍᴇ*      : ${pet?.name || '-'}
◧ *ʟᴇᴠᴇʟ*     : ${pet?.level || '-'}
◧ *ᴇxᴘ*       : ${pet?.exp || '-'}
◧ *ꜱᴋɪɴ ɪᴅ*   : ${pet?.skinId || '-'}
◧ *ꜱᴋɪʟʟ ɪᴅ*  : ${pet?.selectedSkillId || '-'}

👤 | *ꜱᴏᴄɪᴀʟ ɪɴꜰᴏ*
◧ *ꜱɪɢɴᴀᴛᴜʀᴇ*  : ${social?.signature || '-'}
◧ *ʟᴀɴɢᴜᴀɢᴇ*   : ${social?.language || '-'}
◧ *ʀᴀɴᴋ ꜱʜᴏᴡ*  : ${social?.rankShow || '-'}
◧ *ʙᴀᴛᴛʟᴇ ᴛᴀɢꜱ* : ${social?.battleTags?.length ? social.battleTags.join(', ') : '-'}

💳 | *ᴄʀᴇᴅɪᴛ ꜱᴄᴏʀᴇ*
◧ *ꜱᴄᴏʀᴇ*        : ${creditScore?.score || '-'}
◧ *ʀᴇᴡᴀʀᴅ ꜱᴛᴀᴛᴇ* : ${creditScore?.rewardState || '-'}

🧍 | *ᴘʀᴏꜰɪʟᴇ ɪɴꜰᴏ*
◧ *ᴀᴠᴀᴛᴀʀ ɪᴅ*     : ${profile?.avatarId || '-'}
◧ *ᴄʟᴏᴛʜᴇꜱ ɪᴅꜱ*   : ${profile?.clothes?.join(', ') || '-'}
◧ *ᴇQᴜɪᴘᴘᴇᴅ ꜱᴋɪʟʟ* : ${profile?.equippedSkills?.join(', ') || '-'}`;

        if (images?.outfitImage) {
            await sock.sendMessage(remoteJid, {
                image: { url: images.outfitImage },
                caption: resultText
            }, { quoted: message });
        } else if (images?.bannerImage) {
            await sock.sendMessage(remoteJid, {
                image: { url: images.bannerImage },
                caption: resultText
            }, { quoted: message });
        } else {
            await sock.sendMessage(remoteJid, { text: resultText }, { quoted: message });
        }

    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(
            remoteJid,
            { text: `❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇꜱᴀʟᴀʜᴀɴ.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['ffcek', 'ff'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};