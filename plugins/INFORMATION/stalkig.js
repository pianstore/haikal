const fetch = require('node-fetch');
const config = require('@config');
const { logCustom } = require('@lib/logger');

// Fungsi utama handle
async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        // Validasi input username
        if (!trimmedContent) {
            return await sendErrorMessage(
                sock,
                remoteJid,
                `_Masukkan Username Instagram_\n\nContoh: _${prefix + command} kall.v2_`,
                message
            );
        }

        const username = trimmedContent;

        // Kirim reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        // Gunakan API dinamis dari config.js
        const url = `${config.apikey.botz}/api/stalk/ig?apikey=${config.apikey.key}&username=${username}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data?.result) {
            const { username, fullName, bio, followers, following, postsCount, photoUrl } = data.result;

            const igResult = `
*𝗜𝗡𝗦𝗧𝗔𝗚𝗥𝗔𝗠 𝗦𝗧𝗔𝗟𝗞𝗘𝗥𝗦*

*• ᴜꜱᴇʀɴᴀᴍᴇ  :* ${username || 'Tidak diketahui'}
*• ɴᴀᴍᴀ      :* ${fullName || 'Tidak diketahui'}
*• ʙɪᴏ        :* ${bio || 'Tidak tersedia'}
*• ꜰᴏʟʟᴏᴡᴇʀꜱ :* ${followers || 'Tidak diketahui'}
*• ꜰᴏʟʟᴏᴡɪɴɢ :* ${following || 'Tidak diketahui'}
*• ᴘᴏꜱᴛɪɴɢᴀɴ :* ${postsCount || 'Tidak diketahui'}
`;

            if (photoUrl) {
                return await sock.sendMessage(
                    remoteJid,
                    { image: { url: photoUrl }, caption: igResult },
                    { quoted: message }
                );
            } else {
                return await sock.sendMessage(
                    remoteJid,
                    { text: igResult },
                    { quoted: message }
                );
            }
        }

        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendErrorMessage(sock, remoteJid, 'Maaf, tidak ditemukan data untuk username tersebut.', message);
    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendErrorMessage(
            sock,
            remoteJid,
            `Terjadi kesalahan saat mengambil data Instagram.\n\n*Detail*: ${error.message || error}`,
            message
        );
    }
}

// Fungsi utilitas kirim pesan error
async function sendErrorMessage(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands: ['stalkig', 'igstalk'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};