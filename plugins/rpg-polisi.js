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

let handler = async (m, { conn }) => {
let user = global.db.data.users[m.sender]
let __timers = (new Date - user.lastmisi)
let _timers = (3600000 - __timers)
let order = isNaN(user.polisi) ? user.polisi = 0 : user.polisi
let timers = clockString(_timers)
let name = conn.getName(m.sender)
let id = m.sender
let kerja = 'polisi'
conn.misi = conn.misi ? conn.misi : {}
if (id in conn.misi) return conn.reply(m.chat, `🚨 *Misi kamu sebagai ${conn.misi[id][0]} masih berjalan, sabar ya~*`, m)
if (new Date - user.lastmisi > 3600000) {
let randomUang = Math.floor(Math.random() * 10) * 100000
let randomExp = Math.floor(Math.random() * 10) * 1000
let hsl = `
👮‍♀️ *𝗠𝗜𝗦𝗜 𝗣𝗔𝗧𝗥𝗢𝗟𝗜 𝗦𝗘𝗟𝗘𝗦𝗔𝗜!* 👮‍♀️
━━━━━━━━━━━━━━━━
🔎 *Nama Polisi: ${name}*
💰 *Uang Didapat: +Rp ${toRupiah(randomUang)}*
✨ *Exp: +${toRupiah(randomExp)} exp*
📋 *Order Selesai: +1*
🗂️ *Total Patroli: ${toRupiah(order + 1)}
━━━━━━━━━━━━━━━━
🌸 *Kamu berhasil menangkap maling! Terima kasih sudah menjaga keamanan~*
`.trim()
user.money += randomUang
user.exp += randomExp
user.polisi += 1
setTimeout(() => {
m.reply('🚨 *Sedang patroli... mencari jejak maling dengan intuisi cewek kuat~*')
}, 0)
conn.misi[id] = [
kerja,
setTimeout(() => {
delete conn.misi[id]
}, 27000)
]
setTimeout(() => {
m.reply(hsl)
}, 27000)
user.lastmisi = new Date * 1
} else {
m.reply(`⏳ *Sabar ya, kamu baru selesai tugas nih~*\n🕒 *Tunggu: ${timers} sebelum patroli lagi ya sayang~*`)
}
}

handler.help = ["polisi"]
handler.tags = ['rpg']
handler.command = /^(polisi)$/i
handler.register = true
handler.group = true
handler.rpg = true
handler.energy = 30

export default handler

function clockString(ms) {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

const toRupiah = number => {
let num = parseInt(number)
return Math.min(num, Number.MAX_SAFE_INTEGER).toLocaleString('id-ID').replace(/\./g, ",")
}