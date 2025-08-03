const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require("fs-extra");
const path = require("path");
const { GoogleGenAI, Modality } = require('@google/genai');

const API_KEYS = [
    'AIzaSyBOwS78oDxGwbYrJjWJG2RmKroXp8PAV88'
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
            return res;
        } catch (err) {
            const msg = err.toString();
            if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
                console.log(`🔁 api key ke-${i + 1} kuota habis, mencoba key berikutnya...`);
                continue;
            }
            if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
                console.log(`❌ api key ke-${i + 1} tidak valid, skip...`);
                continue;
            }
            throw err;
        }
    }
    throw new Error('tidak ada api key yang valid atau semua sudah limit.');
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, type, isQuoted, content } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _kirim atau balas gambar dengan caption *${prefix + command} <deskripsi prompt>_*`);
        }

        if (!content?.trim()) {
            return await reply(m, `⚠️ _prompt tidak boleh kosong. kirim atau balas gambar dengan caption berisi deskripsi editnya, saran! prompt nya bahasa inggris._`);
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

        const textPrompt = content.trim();
        const contents = [
            { text: textPrompt },
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
                    caption: '*✅ selesai diedit berdasarkan prompt.*'
                }, { quoted: message });
            }
        }

        if (!found) throw new Error('gemini tidak mengembalikan hasil gambar.');

    } catch (error) {
        console.error("GEMINI IMAGE ERROR:", error);

        if (error.message.includes('tidak ada API key')) {
            return await reply(m, `_⚠️ semua api key tidak valid atau sudah mencapai batas harian.\nsilakan ganti api key atau tunggu hingga besok._`);
        }

        return await reply(m, `_terjadi kesalahan saat memproses gambar dengan gemini._`);
    }
}

module.exports = {
    handle,
    Commands: ['tesss'],
    OnlyPremium: false,
    OnlyOwner: true,
    limitDeduction: 1
};