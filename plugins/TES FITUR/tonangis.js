const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require("fs-extra");
const path = require("path");
const { GoogleGenAI, Modality } = require('@google/genai');

// 🔑 Daftar API Key
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

async function generateWithValidKey(contents) {
    for (let i = 0; i < API_KEYS.length; i++) {
        const apiKey = API_KEYS[i];
        const ai = new GoogleGenAI({ apiKey });

        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.0-flash-preview-image-generation',
                contents,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE]
                }
            });
            return res; // sukses
        } catch (err) {
            const msg = err.toString();
            if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
                console.log(`🔁 API Key ke-${i + 1} kuota habis, mencoba key berikutnya...`);
                continue;
            }
            if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
                console.log(`❌ API Key ke-${i + 1} tidak valid, skip...`);
                continue;
            }
            throw err; // error lain, hentikan
        }
    }
    throw new Error('tidak ada API key yang valid atau semua sudah limit.');
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, type, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _kirim atau balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) throw new Error('Gagal mengunduh gambar.');

        const buffer = await fs.readFile(mediaPath);
        const base64 = buffer.toString('base64');
        const mime = 'image/jpeg';

        const contents = [
            {
                text: 'Edit the uploaded image by changing the facial expression to look sad and very emotional. Add natural-looking tears flowing from both eyes, with visible reflections of the water under the eyes and on the cheeks. Add a little red to the eye area to enhance the emotional impression. Dont change the face shape, hairstyle, lighting, or background. Keep the skin texture and lighting realistic, as if the person in the image is actually crying like a real person.'
            },
            {
                inlineData: {
                    mimeType: mime,
                    data: base64
                }
            }
        ];

        const res = await generateWithValidKey(contents);

        let found = false;
        for (let part of res.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                found = true;
                const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                await sock.sendMessage(remoteJid, {
                    image: imageBuffer,
                    caption: '*✅ selesai diedit jadi menangis*'
                }, { quoted: message });
            }
        }

        if (!found) throw new Error('gemini tidak mengembalikan hasil gambar.');

    } catch (error) {
        console.error("GEMINI IMAGE ERROR:", error);

        if (error.message.includes('tidak ada API key')) {
            return await reply(m, `_⚠️ semua API key tidak valid atau sudah mencapai batas harian.\nsilakan ganti API key atau tunggu hingga besok._`);
        }

        return await reply(m, `_terjadi kesalahan saat memproses gambar dengan gemini._`);
    }
}

module.exports = {
    handle,
    Commands: ['tess'],
    OnlyPremium: false,
    OnlyOwner: true,
    limitDeduction: 1
};