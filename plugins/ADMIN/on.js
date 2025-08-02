const { findGroup, updateGroup } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { updateSocket } = require('@lib/scheduled');
const mess = require('@mess');

const icon_on = '🟢';
const icon_off = '🔴';

const OWNER_NUMBERS = ['6285256833258@s.whatsapp.net', '628891768169@s.whatsapp.net']; // Nomor owner dengan format JID

const formatFeatureStatus = (status) => status ? icon_on : icon_off;

const featureList = [
    { name: 'antilink', label: 'ᴀɴᴛɪʟɪɴᴋ' },
    { name: 'antilinkv2', label: 'ᴀɴᴛɪʟɪɴᴋᴠ2' },
    { name: 'antilinkwa', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀ' },
    { name: 'antilinkwav2', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀᴠ2' },
    { name: 'antilinkch', label: 'ᴀɴᴛɪʟɪɴᴋᴄʜ' },
    { name: 'antilinkchv2', label: 'ᴀɴᴛɪʟɪɴᴋᴄʜᴠ2' },
    { name: 'antidelete', label: 'ᴀɴᴛɪᴅᴇʟᴇᴛᴇ' },
    { name: 'antiedit', label: 'ᴀɴᴛɪᴇᴅɪᴛ' },
    { name: 'antigame', label: 'ᴀɴᴛɪɢᴀᴍᴇ' },
    { name: 'antifoto', label: 'ᴀɴᴛɪғᴏᴛᴏ' },
    { name: 'antivideo', label: 'ᴀɴᴛɪᴠɪᴅᴇᴏ' },
    { name: 'antiaudio', label: 'ᴀɴᴛɪᴀᴜᴅɪᴏ' },
    { name: 'antidocument', label: 'ᴀɴᴛɪᴅᴏᴄᴜᴍᴇɴᴛ' },
    { name: 'antikontak', label: 'ᴀɴᴛɪᴋᴏɴᴛᴀᴋ' },
    { name: 'antisticker', label: 'ᴀɴᴛɪsᴛɪᴄᴋᴇʀ' },
    { name: 'antipolling', label: 'ᴀɴᴛɪᴘᴏʟʟɪɴɢ' },
    { name: 'antispamchat', label: 'ᴀɴᴛɪsᴘᴀᴍᴄʜᴀᴛ' },
    { name: 'antivirtex', label: 'ᴀɴᴛɪᴠɪʀᴛᴇx' },
    { name: 'autoai', label: 'ᴀᴜᴛᴏᴀɪ', desc : '_Untuk menggunakan fitur ini silakan balas chat bot atau sebut *ai* di setiap pesan_' },
    { name: 'autohaikal', label: 'ᴀᴜᴛᴏʜᴀɪᴋᴀʟ', desc : '_Untuk menggunakan fitur ini silakan balas chat bot_' },
    { name: 'autorusuh', label: 'ᴀᴜᴛᴏʀᴜsᴜʜ' },
    { name: 'badword', label: 'ʙᴀᴅᴡᴏʀᴅ' },
    { name: 'badwordv2', label: 'ʙᴀᴅᴡᴏʀᴅv2' },
    { name: 'badwordv3', label: 'ʙᴀᴅᴡᴏʀᴅv3' },
    { name: 'detectblacklist', label: 'ᴅᴇᴛᴇᴄᴛʙʟᴀᴄᴋʟɪꜱᴛ' },
    { name: 'detectblacklist2', label: 'ᴅᴇᴛᴇᴄᴛʙʟᴀᴄᴋʟɪꜱᴛ2' },
    { name: 'demote', label: 'demote' },
    { name: 'left', label: 'ʟᴇғᴛ' },
    { name: 'promote', label: 'promote' },
    { name: 'welcome', label: 'ᴡᴇʟᴄᴏᴍᴇ' },
    { name: 'waktusholat', label: 'ᴡᴀᴋᴛᴜꜱʜᴏʟᴀᴛ' },
    { name: 'onlyadmin', label: 'ᴏɴʟʏᴀᴅᴍɪɴ' },
    { name: 'antibot', label: 'ᴀɴᴛɪʙᴏᴛ' },
    { name: 'antitagsw', label: 'ᴀɴᴛɪᴛᴀɢꜱᴡ' },
    { name: 'antitagsw2', label: 'ᴀɴᴛɪᴛᴀɢꜱᴡ2' },
    { name: 'antitagmeta', label: 'ᴀɴᴛɪᴛᴀɢᴍᴇᴛᴀ' },
    { name: 'antitagmeta2', label: 'ᴀɴᴛɪᴛᴀɢᴍᴇᴛᴀ2' },
    { name: 'antiforward', label: 'ᴀɴᴛɪꜰᴏʀᴡᴀʀᴅ' },
    { name: 'antiforward2', label: 'ᴀɴᴛɪꜰᴏʀᴡᴀʀᴅ2' }
];

const createTemplate = (fitur) => {
    let template = `ɢᴜɴᴀᴋᴀɴ *.ᴏɴ ᴄᴏᴍᴍᴀɴᴅ*\n\n`;

    featureList.forEach(({ name, label }) => {
        template += `[${formatFeatureStatus(fitur[name])}] ${label}\n`;
    });

    template += `

ᴄᴏɴᴛᴏʜ : *.ᴏɴ antilink*

Kᴇᴛᴇʀᴀɴɢᴀɴ
${icon_on} = Fɪᴛᴜʀ ᴀᴋᴛɪꜰ
${icon_off} = Fɪᴛᴜʀ ᴛɪᴅᴀᴋ ᴀᴋᴛɪꜰ`;

    return template;
};

const activateFeature = async (remoteJid, featureName, currentStatus, desc) => {
    if (currentStatus) {
        return `⚠️ _Fitur *${featureName}* sudah aktif sebelumnya._`;
    }

    const updateData = { fitur: { [featureName]: true } };
    await updateGroup(remoteJid, updateData);

    if(featureName == 'promote' || featureName == 'demote' || featureName == 'welcome' || featureName == 'left') {
        return `🚀 _Berhasil mengaktifkan fitur untuk_ *${featureName}*. \n\n_Jika belum melakukan set silakan ketik *.set${featureName}*_`;
    }
    if(desc) {
        return `🚀 _Berhasil Mengaktifkan Fitur *${featureName}.*_\n\n${desc}`;
    }
    return `🚀 _Berhasil Mengaktifkan Fitur *${featureName}.*_`;
};

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender } = messageInfo;
    if (!isGroup) return;

    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);

        const isOwner = OWNER_NUMBERS.includes(sender); // Pengecekan owner dengan JID lengkap

        if (!isAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        const dataGrub = await findGroup(remoteJid);
        if (!dataGrub) {
            throw new Error("Group data not found");
        }

        const feature = featureList.find(({ name }) => 
            content.toLowerCase() === name.toLowerCase()
        );

        if (feature) {
            const currentStatus = dataGrub.fitur[feature.name] || false;
            const result = await activateFeature(remoteJid, feature.name, currentStatus, feature.desc);

            if(content.toLowerCase() == 'waktusholat') {
                updateSocket(sock); 
            }

            return await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
        }

        const template_onchat = createTemplate(dataGrub.fitur);
        await sock.sendMessage(remoteJid, { text: template_onchat }, { quoted: message });
    } catch (error) {
        console.error("Error handling the message:", error);
        await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat memproses perintah.' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['on'],
    OnlyPremium: false,
    OnlyOwner: false
};