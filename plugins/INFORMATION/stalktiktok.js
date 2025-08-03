const fetch = require('node-fetch');
const config = require('@config');
const { logCustom } = require('@lib/logger');

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        const trimmedContent = content.trim();

        // Validasi input pengguna
        if (!trimmedContent) {
            return await sendErrorMessage(
                sock,
                remoteJid,
                `_Masukkan Username TikTok_\n\nContoh: _${prefix + command} kompascom_`,
                message
            );
        }

        const user_id = trimmedContent;

        // Kirim reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        // Panggil endpoint API sesuai config.js
        const response = await fetch(`${config.apikey.botz}/api/stalk/tt?username=${user_id}&apikey=${config.apikey.key}`);
        const cek = await response.json();

        if (cek?.result) {
            const { username, likes, followers, following, totalPosts, description, profile } = cek.result;

            const resultTiktok = `
*𝗧𝗜𝗞𝗧𝗢𝗞 𝗦𝗧𝗔𝗟𝗞𝗘𝗥𝗦*

*• ᴜꜱᴇʀɴᴀᴍᴇ  :* ${username || 'Tidak diketahui'}
*• ʟɪᴋᴇ      :* ${likes || 'Tidak diketahui'}
*• ꜰᴏʟʟᴏᴡᴇʀꜱ :* ${followers || 'Tidak diketahui'}
*• ꜰᴏʟʟᴏᴡɪɴɢ :* ${following || 'Tidak diketahui'}
*• ᴜᴘʟᴏᴀᴅ   :* ${totalPosts || 'Tidak diketahui'}
*• ʙɪᴏ ᴅᴀᴛᴀ :* ${description || 'Tidak diketahui'}
`;

            if (profile) {
                return await sock.sendMessage(
                    remoteJid,
                    { image: { url: profile }, caption: resultTiktok },
                    { quoted: message }
                );
            } else {
                return await sock.sendMessage(
                    remoteJid,
                    { text: resultTiktok },
                    { quoted: message }
                );
            }
        }

        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendErrorMessage(sock, remoteJid, 'Maaf, tidak ada data pengguna TikTok yang ditemukan.', message);
    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sendErrorMessage(
            sock,
            remoteJid,
            `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n*Detail*: ${error.message || error}`,
            message
        );
    }
}

// Fungsi utilitas untuk mengirim pesan kesalahan
async function sendErrorMessage(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands: ['stalktiktok','ttstalk'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};