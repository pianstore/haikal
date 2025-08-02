const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");
const axios = require('axios');
const mess = require("@mess");

// Daftar owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, pushName, content, prefix, command, isGroup } = messageInfo;

    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 1*_`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const { size, subject, desc } = groupMetadata;
        const ppUser = await getProfilePictureUrl(sock, sender);
        const ppGroup = await getProfilePictureUrl(sock, remoteJid);

        const apiRoutes = {
            '1': { endpoint: 'https://api.autoresbot.com/api/maker/welcome1', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
            '2': { endpoint: 'https://api.autoresbot.com/api/maker/welcome2', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup, bg: 'https://autoresbot.com/tmp_files/f83c1c1d-f975-4c1b-9919-a00209102065.jpg' } },
            '3': { endpoint: 'https://api.autoresbot.com/api/maker/welcome3', params: { pp: ppUser, name: pushName, gcname: subject, desk: desc, ppgc: ppGroup, bg: 'https://autoresbot.com/tmp_files/f83c1c1d-f975-4c1b-9919-a00209102065.jpg' } },
            '4': { endpoint: 'https://api.autoresbot.com/api/maker/welcome4', params: { pp: ppUser, name: pushName } },
            '5': { endpoint: 'https://api.autoresbot.com/api/maker/welcome5', params: { pp: ppUser, name: pushName } },
            '6': { endpoint: 'https://api.autoresbot.com/api/maker/welcome6', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
            '7': { endpoint: 'https://api.autoresbot.com/api/maker/welcome7', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
        };

        if (content.toLowerCase() === 'text') {
            return await sock.sendMessage(remoteJid, {
                text: `_Welcome bro di grub ${subject}_\n\n_Untuk menggunakan template ini silakan ketik_ *.templatewelcome text*`
            }, { quoted: message });
        }

        const route = apiRoutes[content];
        if (!route) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format tidak valid! Pilih angka 1-7 atau ketik *text*_`
            }, { quoted: message });
        }

        let buffer;
        try {
            const response = await axios.post(route.endpoint, route.params, {
                responseType: 'arraybuffer',
            });
            buffer = Buffer.from(response.data);
        } catch (error) {
            console.error("Error fetching welcome buffer:", error);
            buffer = null;
        }

        if (!buffer) {
            return await sock.sendMessage(remoteJid, {
                text: `_❌ Gagal mengambil gambar welcome dari server_`
            }, { quoted: message });
        }

        await sock.sendMessage(remoteJid, {
            image: buffer,
            caption: `_Untuk menggunakan template ini silakan ketik_ *.templatewelcome ${content}*`
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(remoteJid, {
            text: `_❌ Terjadi kesalahan: ${error.message}_`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['teswelcome'],
    OnlyPremium: false,
    OnlyOwner: false
};