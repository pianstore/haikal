const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

// Daftar nomor owner
const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net'];

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup, content, prefix, command } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;

        const isAdmin = participants.some(p => p.id === sender && p.admin);
        const isOwner = OWNER_NUMBERS.includes(sender);

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if (!content.trim()) {
            return sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} open*_`.trim() },
                { quoted: message }
            );
        }

        const [action] = content.trim().split(' ');

        if (!['open', 'close'].includes(action)) {
            return sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ Format tidak valid!\n_Silahkan Ketik:_\n_${command} open_\n_${command} close_`.trim()
                },
                { quoted: message }
            );
        }

        await sock.groupSettingUpdate(remoteJid, action === 'open' ? 'not_announcement' : 'announcement');

        const responseText = action === 'open' ? mess.action.grub_open : mess.action.grub_close;

        return sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });

    } catch (error) {
        console.error(error);
        return sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan. Pastikan bot memiliki izin admin untuk mengelola grup.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['grub', 'group', 'grup', 'groub', 'gc'],
    OnlyPremium: false,
    OnlyOwner: false,
};