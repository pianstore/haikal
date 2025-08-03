const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, pushName } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    try {
        const dataUsers = await findUser(sender);

        if (dataUsers) {
            const alasan = content 
                ? `ᴀʟᴀsᴀɴ: ${content.length > 100 ? content.slice(0, 100) + "..." : content}`
                : "ᴀʟᴀsᴀɴ: ᴛɪᴅᴀᴋ ᴅɪsᴇʙᴜᴛᴋᴀɴ.";

            const waktu = new Date().toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            await updateUser(sender, {
                status: "afk",
                afk: {
                    lastChat: new Date().toISOString(),
                    alasan,
                },
            });

            const afkMessage = `
╭───〔 *ᴍᴏᴅᴇ ᴀꜰᴋ ᴀᴋᴛɪꜰ* 〕
│
├⨾ ɴᴀᴍᴀ : ${pushName}
├⨾ ᴡᴀᴋᴛᴜ : ${waktu}
├⨾ ${alasan}
│
╰──⟪ sᴇᴅᴀɴɢ ᴀꜰᴋ, ᴊᴀɴɢᴀɴ ᴅɪɢᴀɴɢɢᴜ ⟫
            `.trim();

            await sock.sendMessage(
                remoteJid,
                { text: afkMessage },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error in AFK command:", error);

        await sock.sendMessage(
            remoteJid,
            { text: "❌ ᴛᴇʀᴊᴀᴅɪ ᴋᴇꜱᴀʟᴀʜᴀɴ sᴀᴀᴛ ᴘᴇʀɪɴᴛᴀʜ ᴀꜰᴋ ᴅɪᴘʀᴏsᴇs. ᴄᴏʙᴀ ʟᴀɢɪ ɴᴀɴᴛɪ." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["afk"],
    OnlyPremium: false,
    OnlyOwner: false
};