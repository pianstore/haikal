const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const UPLOAD_TIMEOUT = 10000; // 10 detik

// --- Semua fungsi upload ---
async function uploadToCatbox(filePath) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', fs.createReadStream(filePath));
  const res = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders()
  });
  return res.data;
}

async function uploadToUguu(filePath) {
  const form = new FormData();
  form.append('files[]', fs.createReadStream(filePath));
  const res = await axios.post('https://uguu.se/upload', form, {
    headers: form.getHeaders()
  });
  if (res.data?.files?.[0]?.url) return res.data.files[0].url;
  throw new Error('Respons dari Uguu tidak sesuai format.');
}

async function uploadToAutoresbot(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('expired', '6months');
  const res = await axios.post('https://autoresbot.com/tmp-files/upload', form, {
    headers: {
      ...form.getHeaders(),
      'Referer': 'https://autoresbot.com/',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  if (res.data?.data?.url) return res.data.data.url;
  throw new Error('Respons dari Autoresbot tidak valid.');
}

async function uploadToElrayyXml(filePath) {
  const form = new FormData();
  form.append('myFile', fs.createReadStream(filePath));
  const res = await axios.post('https://elrayyxml-tmp-file.hf.space/upload', form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity
  });
  const data = res.data;
  if (typeof data === 'string') {
    const m = data.match(/https?:\/\/[^\s]+\/uploads\/[^\s"'<>]+/);
    if (m) return m[0];
  }
  if (data?.fileUrl) return data.fileUrl;
  throw new Error('Respons dari ElrayyXml gagal.');
}

// --- Handler utama ---
async function handle(sock, messageInfo) {
  // rename destructured 'message' → 'msg'
  const { m, remoteJid, message: msg, isQuoted, type, prefix, command } = messageInfo;
  const mediaType = isQuoted ? isQuoted.type : type;
  if (!['image','video','audio','document','sticker'].includes(mediaType)) {
    return await reply(m, `⚠️ kirim atau balas media dengan caption *${prefix+command}*`);
  }

  // react loading
  await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

  // download media
  const mediaBufferOrFilename = isQuoted
    ? await downloadQuotedMedia(msg)
    : await downloadMedia(msg);
  if (!mediaBufferOrFilename) {
    return await reply(m, '⚠️ gagal mengunduh media.');
  }

  const mediaPath = path.join('tmp', mediaBufferOrFilename);
  if (!fs.existsSync(mediaPath)) {
    return await reply(m, '⚠️ file tidak ditemukan setelah diunduh.');
  }

  // upload ke semua service
  const uploaders = [
    { name: 'catbox', fn: uploadToCatbox },
    { name: 'uguu', fn: uploadToUguu },
    { name: 'autoresbot', fn: uploadToAutoresbot },
    { name: 'elrayyxml', fn: uploadToElrayyXml }
  ];

  const results = [];
  for (const { name, fn } of uploaders) {
    try {
      const url = await Promise.race([
        fn(mediaPath),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), UPLOAD_TIMEOUT))
      ]);
      results.push({ name, url });
    } catch (err) {
      results.push({ name, url: `❌ ${err.message}` });
    }
  }

  // format output
  const entries = results.map(r => ({
    name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    url: r.url
  }));
  const cards = entries.map((e, i) =>
    `${i + 1}. 🖇️ *${e.name}*\n   ${e.url}`
  );
  const body = cards.join('\n────────────────────\n');

  // rename output string var to 'replyText'
  const replyText = [
    '🌟✨ *upload selesai* ✨🌟',
    '',
    body,
    '',
    '🚀 _terimakasih sudah menggunakan layanan kami_'
  ].join('\n');

  await reply(m, replyText);

  // cleanup
  try { fs.unlinkSync(mediaPath); } catch {}
}

module.exports = {
  handle,
  Commands: ['tourl'],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1
};