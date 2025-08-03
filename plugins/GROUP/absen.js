const { findAbsen, updateAbsen, createAbsen } = require("@lib/absen");
const moment = require("moment-timezone");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return;

    try {
        const now = moment().tz("Asia/Jakarta");
        const tanggal = now.format("dddd, DD MMMM YYYY");
        const waktu   = now.format("HH:mm:ss");

        const data = await findAbsen(remoteJid);
        let textNotif;
        let totalAbsen;

        const getApresiasi = (pos) => {
            switch (pos) {
                case 1: return "🥇 ᴀɴᴅᴀ ᴘᴇʀᴛᴀᴍᴀ ʏᴀɴɢ ᴀʙꜱᴇɴ ʜᴀʀɪ ɪɴɪ!";
                case 2: return "🥈 ᴜʀᴜᴛᴀɴ ᴋᴇ-2, ꜱᴇᴍᴀɴɢᴀᴛ ᴛᴇʀᴜꜱ!";
                case 3: return "🥉 ᴘᴏꜱɪꜱɪ ᴋᴇ-3 ᴅᴀᴘᴀᴛ ᴀᴘʀᴇꜱɪᴀꜱɪ!";
                default: return null;
            }
        };

        if (data) {
            if (data.member.includes(sender)) {
                totalAbsen = data.member.length;
                textNotif = `
╭─────────────✦
│   ᴀʙꜱᴇɴ ʜᴀʀɪ ɪɴɪ
├─────────────•
│ ⚠️ ᴀɴᴅᴀ ꜱᴜᴅᴀʜ ᴀʙꜱᴇɴ
│ 📅 ᴛᴀɴɢɢᴀʟ : ${tanggal}
│ 👥 ᴛᴏᴛᴀʟ   : ${totalAbsen} ᴏʀᴀɴɢ
╰──────────────────✦`.trim();
            } else {
                const newList = [...data.member, sender];
                await updateAbsen(remoteJid, { member: newList });
                totalAbsen = newList.length;

                const apresiasi = getApresiasi(totalAbsen);

                textNotif = `
╭─────────────✦
│   ᴀʙꜱᴇɴ ʙᴇʀʜᴀꜱɪʟ
├─────────────•
│ ✅ ᴛᴇʀᴄᴀᴛᴀᴛ ᴅᴇɴɢᴀɴ ʙᴀɪᴋ
│ 👤 ᴜꜱᴇʀ   : @${sender.split("@")[0]}
│ 📅 ᴛᴀɴɢɢᴀʟ : ${tanggal}
│ ⏰ ᴡᴀᴋᴛᴜ   : ${waktu}
│ 👥 ᴛᴏᴛᴀʟ   : ${totalAbsen} ᴏʀᴀɴɢ
${apresiasi ? `│ ${apresiasi}` : ''}
╰───────────────────✦`.trim();
            }
        } else {
            await createAbsen(remoteJid, { member: [sender] });

            textNotif = `
╭─────────────✦
│   ᴀʙꜱᴇɴ ᴘᴇʀᴛᴀᴍᴀ
├─────────────•
│ ✅ ᴅɪᴄᴀᴛᴀᴛ sᴇʙᴀɢᴀɪ ᴀʙꜱᴇɴ ᴘᴇʀᴛᴀᴍᴀ
│ 👤 ᴜꜱᴇʀ   : @${sender.split("@")[0]}
│ 📅 ᴛᴀɴɢɢᴀʟ : ${tanggal}
│ ⏰ ᴡᴀᴋᴛᴜ   : ${waktu}
│ 👥 ᴛᴏᴛᴀʟ   : 1 ᴏʀᴀɴɢ
│ 🥇 ᴀɴᴅᴀ ᴘᴇʀᴛᴀᴍᴀ ʏᴀɴɢ ᴀʙꜱᴇɴ ʜᴀʀɪ ɪɴɪ!
╰────────────────────✦`.trim();
        }

        return await sock.sendMessage(
            remoteJid,
            { text: textNotif, mentions: [sender] },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error handling absen:", error);
        return await sock.sendMessage(
            remoteJid,
            {
                text: `
╭─────────────✦
│   ᴇʀʀᴏʀ ᴀʙꜱᴇɴ
├─────────────•
│ ❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇꜱᴀʟᴀʜᴀɴ
│ ꜱɪʟᴀᴋᴀɴ ᴄᴏʙᴀ ʟᴀɢɪ sᴇʙᴇɴᴛᴀʀ ʟᴀɢɪ
╰─────────────✦`.trim()
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["absen"],
    OnlyPremium: false,
    OnlyOwner: false,
};