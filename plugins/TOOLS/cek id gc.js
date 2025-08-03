const { reply } = require("@lib/utils");
const moment = require("moment-timezone");
const config = require("@config");
const ApiAutoresbot = require("api-autoresbot");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validasi input
        if (!content) {
            return await reply(m, `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ _${prefix + command} https://chat.whatsapp.com/xxxxxxxxxxxxxxxx_`);
        }

        // Ekstrak kode undangan
        const inviteCode = content.split("https://chat.whatsapp.com/")[1];
        if (!inviteCode) {
            return await reply(m, "_❌ Link grup tidak valid. Format harus seperti ini:_\nhttps://chat.whatsapp.com/xxxxxxxxxxxxxxxx");
        }

        // Kirim reaksi indikator proses
        await sock.sendMessage(remoteJid, { react: { text: "⏳", key: message.key } });

        // Ambil info grup dari query manual
        const response = await sock.query({
            tag: "iq",
            attrs: {
                type: "get",
                xmlns: "w:g2",
                to: "@g.us"
            },
            content: [{ tag: "invite", attrs: { code: inviteCode } }]
        });

        const groupInfo = response.content[0]?.attrs || {};

        const groupDetails = `「 _*Info Grup*_ 」\n\n` +
    `◧ *Nama:* ${groupInfo.subject || "-"}\n` +
    `◧ *Deskripsi:* ${groupInfo.s_t ? moment(groupInfo.s_t * 1000).tz("Asia/Jakarta").format("DD-MM-YYYY, HH:mm:ss") : "-"}\n` +
    `◧ *Owner:* ${groupInfo.creator ? "@" + groupInfo.creator.split("@")[0] : "-"}\n` +
    `◧ *Dibuat pada:* ${groupInfo.creation ? moment(groupInfo.creation * 1000).tz("Asia/Jakarta").format("DD-MM-YYYY, HH:mm:ss") : "-"}\n` +
    `◧ *Jumlah Member:* ${groupInfo.size || "-"}\n` +
    `🆔 *ID Grup:* ${groupInfo.id ? `${groupInfo.id}@c.us` : "-"}`;

        // Coba ambil foto profil grup
        let ppUrl = null;
        try {
            ppUrl = await sock.profilePictureUrl(`${groupInfo.id}@g.us`, "image");
        } catch {
            const api = new ApiAutoresbot(config.APIKEY);
            const apiResponse = await api.get('/api/stalker/whatsapp-group', { url: content });

            if (!apiResponse || !apiResponse.imageLink) {
                throw new Error("Gagal mendapatkan foto profil dari API.");
            }
            ppUrl = apiResponse.imageLink;
        }

        // Kirim info grup (dengan/atau tanpa gambar)
        if (ppUrl) {
            await sock.sendMessage(remoteJid, {
                image: { url: ppUrl },
                caption: groupDetails
            }, { quoted: message });
        } else {
            await reply(m, groupDetails);
        }

    } catch (error) {
        console.error("❌ Kesalahan saat cekidgc:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        return await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Terjadi kesalahan saat mengambil data grup. Pastikan link valid." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["cekidgc"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};