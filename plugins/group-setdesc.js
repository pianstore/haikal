/*
██╗███████╗██╗░░░██╗███╗░░░███╗██╗
██║╚════██║██║░░░██║████╗░████║██║
██║░░███╔═╝██║░░░██║██╔████╔██║██║
██║██╔══╝░░██║░░░██║██║╚██╔╝██║██║
██║███████╗╚██████╔╝██║░╚═╝░██║██║
╚═╝╚══════╝░╚═════╝░╚═╝░░░░░╚═╝╚═╝
Note: Terimakasih Telah Membeli Script Ini Semoga Bermanfaat
Copyright © 2024 - 2025 Crystalia
꒰⚘꒱ Admin Contact ꒱⟡
𓅯 𝙉͢𝙖𝙧𝙪𝙮𝙖 𝙄͢𝙯𝙪𝙢𝙞
https://linkbio.co/naruyaizumi
𓅯 𝙑͢𝙡𝙞𝙣𝙚
WhatsApp: wa.me/6285770019354
𓅯 𝑺͢𝑿𝒁𝒏𝒊𝒈𝒉𝒕𝒎𝒂𝒓𝒆
WhatsApp: wa.me/6281398961382
*/

let handler = async (m, { conn, args, usedPrefix, command }) => {
if (!args[0]) return m.reply(`🍡 *Contoh penggunaan: ${usedPrefix + command} Ini deskripsi baru~*`)
try {
await conn.groupUpdateDescription(m.chat, args.join(' '))
m.reply('🍓 *Deskripsi grup berhasil diubah yaa~*')
} catch (e) {
console.error(e)
m.reply('🍬 *Gagal mengubah deskripsi grup. Pastikan bot admin dan waktunya belum dibatasi oleh WhatsApp~*')
}
}

handler.help = ['setdesc']
handler.tags = ['group']
handler.command = /^(setdesc|setdesk|setdeskripsi)$/i
handler.group = true
handler.botAdmin = true
handler.admin = true

export default handler