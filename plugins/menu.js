const menu = require('@DB/menu');

const linkGroup = '';
const AUDIO_MENU = true;

const fs = require("fs");
const path = require("path");
const config = require("@config");
const { readFileAsBuffer } = require('@lib/fileHelper');
const { reply, style, getCurrentDate, readMore } = require('@lib/utils');
const { isOwner, isPremiumUser } = require("@lib/users");

const soundPagi = 'kall.mp3';
const soundSiang = 'kall.mp3';
const soundSore = 'kall.mp3';
const soundPetang = 'kall.mp3';
const soundMalam = 'kall.mp3';

function getGreeting() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const wibHours = (utcHours + 7) % 24;
    let fileName;

    if (wibHours >= 5 && wibHours <= 10) {
        fileName = soundPagi;
    } else if (wibHours >= 11 && wibHours < 15) {
        fileName = soundSiang;
    } else if (wibHours >= 15 && wibHours <= 18) {
        fileName = soundSore;
    } else if (wibHours > 18 && wibHours <= 19) {
        fileName = soundPetang;
    } else {
        fileName = soundMalam;
    }

    const filePath = path.join(process.cwd(), "database", "audio", fileName);
    try {
        return fs.readFileSync(filePath);
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

async function sendReaction(sock, message, emoji) {
    await sock.sendMessage(message.key.remoteJid, {
        react: { text: emoji, key: message.key }
    });
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, pushName, sender, content, prefix, command, message } = messageInfo;

    await sendReaction(sock, message, '⏰'); // REAKSI LOADING

    const roleUser = await isOwner(sender) ? 'Owner' : await isPremiumUser(sender) ? 'Premium' : 'User';

    // Tambahan hari ke tanggal
    const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const hari = hariList[now.getDay()];
    const date = `${hari}, ${getCurrentDate()}`;

    const category = content.toLowerCase();
    let response;
    let result;

    if (category && menu[category]) {
        response = formatMenu(category.toUpperCase(), menu[category]);
        result = await reply(m, style(response) || 'Failed to apply style.');
        await sendReaction(sock, message, '✅'); // REAKSI SELESAI
    } else {
        if ((command === 'menu' && content === '') || command === 'allmenu') {
            response = `
╭────────〔 *ɪɴғᴏ* 〕─────────
├─────
│ ɴᴀᴍᴀ   : ${pushName || 'Unknown'}
│ ꜱᴛᴀᴛᴜꜱ : ${roleUser}
│ ꜱᴄʀɪᴘᴛ : v${config.version}
│ ᴛᴀɴɢɢᴀʟ : ${date}
├─────
╰───────────────────────

${readMore()}

${Object.keys(menu).map(key => formatMenu(key.toUpperCase(), menu[key])).join('\n\n')}
`;

            const buffer = readFileAsBuffer('@assets/allmenu.mp4');

            result = await sock.sendMessage(remoteJid, {
                video: buffer,
                caption: style(`${response}`),
                gifPlayback: true
            }, { quoted: message });

            if (AUDIO_MENU) {
                const audioBuffer = getGreeting();
                if (audioBuffer) {
                    await sock.sendMessage(remoteJid, {
                        audio: audioBuffer,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: result });
                }
            }

            await sendReaction(sock, message, '✅'); // REAKSI SELESAI
            return;
        }

        if (command === 'menu') {
            response = `
╭───〔 *ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ* 〕
│
${Object.keys(menu).map(key => `│ • ${key}`).join('\n')}
│
╰─────────────────╯

_Ketik nama kategori untuk melihat isinya._  
Contoh: *.menu ai* atau *.allmenu* untuk semua kategori.
`;
            result = await reply(m, style(response) || 'Failed to apply style.');
            await sendReaction(sock, message, '✅'); // REAKSI SELESAI
        }
    }
}

const formatMenu = (title, items) => {
    const formattedItems = items.map(item => {
        if (typeof item === 'string') {
            return `│ • ${item}`;
        }
        if (typeof item === 'object' && item.command && item.description) {
            return `│ • ${item.command} ${item.description}`;
        }
        return '│ • [Invalid item]';
    });

    return `╭───〔 *${title}* 〕\n${formattedItems.join('\n')}\n╰─────────────────╯`;
};

module.exports = {
    handle,
    Commands: ['menu', 'allmenu'],
    OnlyPremium: false,
    OnlyOwner: false
};