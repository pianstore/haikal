const moment = require('moment-timezone');
const { reply } = require("@lib/utils");

const regionNames = new Intl.DisplayNames(['id'], { type: 'region' });

const detectOperator = (num) => {
    const prefix = num.replace('+62', '').slice(0, 3);
    if (/^(811|812|813|821|822|823|851|852|853|858)$/.test(prefix)) return 'Telkomsel';
    if (/^(814|815|816|855|856|857|859|895|896|897|898|899)$/.test(prefix)) return 'Indosat / Tri';
    if (/^(817|818|819|877|878)$/.test(prefix)) return 'XL Axiata';
    if (/^(831|832|833|838)$/.test(prefix)) return 'AXIS';
    if (/^(881|882|883|884|885|886|887|888|889)$/.test(prefix)) return 'Smartfren';
    return 'Tidak diketahui';
};

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, mentionedJid } = messageInfo;

    try {
        let num = m.quoted?.sender || mentionedJid?.[0] || content?.trim();
        if (!num) {
            return await reply(m, `🌸 Gomen senpai~ siapa nih yang mau Shiroko stalk?\n\nContoh:\n${prefix + command} @tag atau 628xxxxx`);
        }

        num = num.replace(/\D/g, '') + '@s.whatsapp.net';
        let exists = await sock.onWhatsApp(num).catch(() => []);
        if (!exists[0]?.exists) {
            return await reply(m, `🚫 Maaf Senpai, nomor itu tidak terdaftar di WhatsApp~`);
        }

        let img = await sock.profilePictureUrl(num, 'image').catch(() => null);
        let bio = await sock.fetchStatus(num).catch(() => null);
        let business = await sock.getBusinessProfile(num).catch(() => null);

        let name;
        try {
            name = await sock.getName(num);
        } catch {
            name = 'Tidak diketahui';
        }

        const rawNum = num.split('@')[0];
        const nomorIntl = `+${rawNum}`;
        const country = nomorIntl.startsWith('+62') ? 'INDONESIA' : 'Tidak diketahui';
        const jenisNomor = nomorIntl.length >= 11 ? 'Mobile' : 'Tidak diketahui';
        const operator = nomorIntl.startsWith('+62') ? detectOperator(nomorIntl) : '-';

        let info = `📱 *Stalking WhatsApp Senpai~*\n\n`;
        info += `👤 *Nama:* ${name}\n`;
        info += `📞 *Nomor:* ${nomorIntl}\n`;
        info += `🌍 *Negara:* ${country}\n`;
        info += `📡 *Jenis Nomor:* ${jenisNomor}\n`;
        info += `📶 *Operator:* ${operator}\n`;
        info += `🔗 *Link WA:* https://wa.me/${rawNum}\n`;
        info += `🗣️ *Sebutan:* @${rawNum}\n`;
        info += `📝 *Status:* ${bio?.status || '-'}\n`;
        info += `📅 *Diperbarui:* ${bio?.setAt ? moment(bio.setAt).locale('id').format('LLLL') : '-'}`;

        if (business) {
            info += `\n\n🏢 *Akun Bisnis~*\n`;
            info += `✅ *Verified:* ${business.verified_name ? 'Ya (Centang Hijau~)' : 'Tidak'}\n`;
            info += `🆔 *Business ID:* ${business.wid}\n`;
            info += `🌐 *Website:* ${business.website || '-'}\n`;
            info += `📧 *Email:* ${business.email || '-'}\n`;
            info += `🏬 *Kategori:* ${business.category || '-'}\n`;
            info += `📍 *Alamat:* ${business.address || '-'}\n`;
            info += `🕰️ *Zona Waktu:* ${business.business_hours?.timezone || '-'}\n`;
            info += `📋 *Deskripsi:* ${business.description || '-'}`;
        } else {
            info += `\n\n💬 *Akun WhatsApp Biasa~*`;
        }

        if (img) {
            await sock.sendMessage(remoteJid, { image: { url: img }, caption: info, mentions: [num] }, { quoted: m });
        } else {
            await sock.sendMessage(remoteJid, { text: info, mentions: [num] }, { quoted: m });
        }

    } catch (error) {
        console.error('[WASTALK]', error);
        return await sock.sendMessage(remoteJid, {
            text: `⚠️ Terjadi kesalahan saat mengakses data.\n\n📄 Detail: ${error?.message || "Tidak diketahui"}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["wastalk"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};