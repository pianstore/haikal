const axios = require('axios');
const config = require('@config');
const { logCustom } = require('@lib/logger');

// Daftar API key Gemini Flash
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

// Fungsi Gemini Flash
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
  throw new Error('Semua API key Gemini limit atau invalid.');
}

// Handler utama
async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    if (!content?.trim()) {
      return await sock.sendMessage(remoteJid, {
        text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} siapa presiden indonesia*_`
      }, { quoted: message });
    }

    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    // Fallback 1: RipleAI
    try {
      const { data: res1 } = await axios.get(`https://api.nekorinn.my.id/ai/ripleai?text=${encodeURIComponent(content)}`);
      if (res1?.status && res1?.result) {
        return await sock.sendMessage(remoteJid, { text: res1.result }, { quoted: message });
      }
    } catch (_) {}

    // Fallback 2: DiiOffc
    try {
      const { data: res2 } = await axios.get(`https://api.diioffc.web.id/api/ai/bard?query=${encodeURIComponent(content)}`);
      if (res2?.status && res2?.result?.message) {
        return await sock.sendMessage(remoteJid, { text: res2.result.message }, { quoted: message });
      }
    } catch (_) {}

    // Fallback 3: Gemini Flash
    try {
      const result3 = await callGeminiFlash(content.trim());
      return await sock.sendMessage(remoteJid, { text: result3 }, { quoted: message });
    } catch (_) {}

    // Jika semua gagal
    await sock.sendMessage(remoteJid, {
      text: `❌ semua endpoint gagal memberikan respons valid.`
    }, { quoted: message });

  } catch (error) {
    logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
    await sock.sendMessage(remoteJid, {
      text: `❌ terjadi kesalahan saat memproses permintaan.`
    }, { quoted: message });
  }
}

module.exports = {
  handle,
  Commands: ['ai'],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1,
};