const fetch = require('node-fetch');
const { reply } = require('@lib/utils');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function spamngl(link, pesan, jumlah) {
  if (!link.startsWith('https://ngl.link/')) throw new Error('Luu ngirim link apa sii 🙄');
  if (!pesan) throw new Error('lu mau ngirim pesan apa?');
  if (isNaN(jumlah) || jumlah < 1) throw new Error('Woilahh jumlah angka minimal lebih dri 0');

  const username = link.split('https://ngl.link/')[1];
  if (!username) throw new Error('eror username tidak ditemukan');

  let sukses = 0, gagal = 0;

  for (let i = 0; i < jumlah; i++) {
    try {
      await fetch('https://ngl.link/api/submit', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `username=${username}&question=${encodeURIComponent(pesan)}&deviceId=1`
      });
      sukses++;
    } catch (err) {
      console.error('gagal kirim : ', err);
      gagal++;
    }
    await delay(1000);
  }

  return { sukses, gagal, username };
}

async function handle(sock, messageInfo) {
  const { content, m } = messageInfo;

  let [link, jumlahStr, ...pesanArr] = content.split('|');
  let jumlah = parseInt(jumlahStr);
  let pesan = pesanArr.join('|').trim();

  if (!link || !jumlahStr || !pesan) {
    return await reply(m, `Contoh : .spamngl https://ngl.link/username|3|halo kamu siapa`);
  }

  await reply(m, 'waitt');

  try {
    let hasil = await spamngl(link.trim(), pesan, jumlah);
    let berhasil = hasil.sukses;
    let gagal = hasil.gagal;
    let total = berhasil + gagal;
    let persenBerhasil = ((berhasil / total) * 100).toFixed(1);
    let persenGagal = ((gagal / total) * 100).toFixed(1);

    await reply(m, `✅ Spam selesai ke @${hasil.username}
✔️ Berhasil: ${berhasil} (${persenBerhasil}%)
❌ Gagal: ${gagal} (${persenGagal}%)`);
  } catch (e) {
    await reply(m, `❌ Error: ${e?.message || e}`);
  }
}

module.exports = {
  handle,
  Commands: ['spamngl'],
  OnlyPremium: false,
  OnlyOwner: true
};