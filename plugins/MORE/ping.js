const axios = require('axios');

function formatRuntime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;
    const domain = "https://clients3.google.com";
    const uptime = formatRuntime(process.uptime());

    try {
        if (!content) {
            const startTime = process.hrtime();
            const endTime = process.hrtime(startTime);
            const responseTime = endTime[0] + endTime[1] / 1e9;

            await sock.sendMessage(
                remoteJid,
                {
                    text:
`*╭─[ ⚡ ʙᴏᴛ ꜱᴛᴀᴛᴜꜱ ]*
│ • *ᴜᴘᴛɪᴍᴇ:* ${uptime}
│ • *ʀᴇꜱᴘᴏɴꜱᴇ ᴛɪᴍᴇ:* ${responseTime.toFixed(6)} _s_
*╰────────────────────*`,
                    buttons: [
                        { buttonId: ".ping", buttonText: { displayText: "ping" }, type: 1 }
                    ],
                    headerType: 1
                },
                { quoted: message }
            );
            return;
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏱️", key: message.key } });

        const startTime = process.hrtime();
        await axios.get(domain);
        const endTime = process.hrtime(startTime);
        const responseTime = endTime[0] + endTime[1] / 1e9;

        await sock.sendMessage(
            remoteJid,
            {
                text:
`*╭─[ ⚡ ʙᴏᴛ ꜱᴛᴀᴛᴜꜱ ]*
│ • *ᴜᴘᴛɪᴍᴇ:* ${uptime}
│ • *ʀᴇꜱᴘᴏɴꜱᴇ ᴛɪᴍᴇ:* ${responseTime.toFixed(6)} _s_
*╰────────────────────*`,
                buttons: [
                    { buttonId: ".ping", buttonText: { displayText: "ping" }, type: 1 }
                ],
                headerType: 1
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in ping handler:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ terjadi kesalahan saat ping. coba lagi nanti." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["ping","p","."],
    OnlyPremium: false,
    OnlyOwner: false
};