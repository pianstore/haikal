const fetch = require('node-fetch');
const { logCustom } = require('@lib/logger');

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_ᴍᴀsᴜᴋᴋᴀɴ ᴜsᴇʀɴᴀᴍᴇ ʀᴏʙʟᴏx_\n\n${prefix + command} haikalzxyz` },
                { quoted: message }
            );
        }

        const username = trimmedContent;
        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const url = `https://zenzxz.dpdns.org/stalker/roblox?username=${encodeURIComponent(username)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json?.status || !json?.success || !json?.data) {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ ᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ ᴀᴛᴀᴜ ᴜsᴇʀɴᴀᴍᴇ sᴀʟᴀʜ.' },
                { quoted: message }
            );
        }

        const { account, presence, stats, badges } = json.data;

        const caption = `👾 *ʀᴏʙʟᴏx ᴜsᴇʀ ɪɴғᴏ*

◉ ᴜsᴇʀɴᴀᴍᴇ        : ${account.username}
◉ ᴅɪsᴘʟᴀʏ ɴᴀᴍᴇ    : ${account.displayName}
◉ ᴠᴇʀɪғɪᴇᴅ ʙᴀᴅɢᴇ  : ${account.hasVerifiedBadge ? 'ʏᴀ' : 'ᴛɪᴅᴀᴋ'}
◉ ʙᴀɴɴᴇᴅ          : ${account.isBanned ? 'ʏᴀ' : 'ᴛɪᴅᴀᴋ'}
◉ ᴅᴇsᴋʀɪᴘsɪ       : ${account.description || '-'}
◉ ᴀᴋᴜɴ ᴅɪʙᴜᴀᴛ     : ${account.created}
◉ sᴛᴀᴛᴜs ᴏɴʟɪɴᴇ   : ${presence.isOnline ? 'ᴏɴʟɪɴᴇ' : 'ᴏғғʟɪɴᴇ'}
◉ ᴛᴇʀᴀᴋʜɪʀ ᴏɴʟɪɴᴇ : ${presence.lastOnline || '-'}
◉ ɢᴀᴍᴇ ᴛᴇʀᴀᴋʜɪʀ   : ${presence.recentGame || '-'}
◉ ᴊᴜᴍʟᴀʜ ᴛᴇᴍᴀɴ    : ${stats.friendCount}
◉ ғᴏʟʟᴏᴡᴇʀs       : ${stats.followers}
◉ ғᴏʟʟᴏᴡɪɴɢ       : ${stats.following}
◉ ᴊᴜᴍʟᴀʜ ʙᴀᴅɢᴇ    : ${Array.isArray(badges) ? badges.length : 0}`;

        await sock.sendMessage(remoteJid, {
            image: { url: account.profilePicture },
            caption
        }, { quoted: message });

    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(
            remoteJid,
            {
                text: `❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇsᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴍᴇᴍᴘʀᴏsᴇs ᴘᴇʀᴍɪɴᴛᴀᴀɴ.\n\n*ᴅᴇᴛᴀɪʟ:* ${error.message || error}`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['robloxcek','roblox'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1
};