const axios = require('axios');
const { reply } = require('@lib/utils');

// Daftar API key
const API_KEYS = [
  'AIzaSyAmraIGOnVFLD1dPQKUh3O5BtTl5qRsL5w',
  'AIzaSyAH7W4vVqzNZkw6zTG3GMfKWEnBGEGZ72k',
  'AIzaSyAqRO4NgsFZ7Jf-gYDt1dDEHVJCse9al2M',
  'AIzaSyBaqx7ytwfA8NeZQIVp3imqtMPPACU4niQ',
  'AIzaSyCGS6mv9RIfXZM3jcZpx9WYGSPPMrJ1zaI',
  'AIzaSyBeX2w_yTI_1kKYVwrX_S8MQb8T8yHeejk',
  'AIzaSyATATwnCJrHYI0h7UFxnI3Y9BO18sIi1Vg',
  'AIzaSyDD8hGWPOTHxpLaTUavuZD5pxAWNVbNUv4',
  'AIzaSyBx5-e-fOMQV6TBiYXVEW3lKojohpqNOqA'
];

// Fungsi pakai API key yang valid
async function callGeminiFlash(prompt) {
  for (const key of API_KEYS) {
    try {
      const { data } = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key }
        }
      );
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (result) return result;
    } catch (err) {
      const msg = err.toString();
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('invalid')) continue;
      throw err;
    }
  }
  throw new Error('Semua API key limit atau tidak valid.');
}

// Plugin handler
async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content?.trim()) {
      return await sock.sendMessage(remoteJid, {
        text: `_⚠️ format penggunaan:_\n\n💬 contoh: *${prefix + command} siapa presiden indonesia?*`
      }, { quoted: message });
    }

    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    const result = await callGeminiFlash(content.trim());

    await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

  } catch (err) {
    console.error("GEMINI FLASH ERROR:", err);
    return await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat memproses permintaan.'
    }, { quoted: message });
  }
}

module.exports = {
  handle,
  Commands: ['ai3'],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1
};