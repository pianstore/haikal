const fetch = require('node-fetch');
const config = require('@config');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const { sendImageAsSticker } = require('@lib/exif');
const { logCustom } = require('@lib/logger');

const ensureTmpFolder = () => {
    const tmpPath = path.join(__dirname, '..', '..', 'tmp');
    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath, { recursive: true });
    }
    return tmpPath;
};

async function convertGifToMp4(inputPath, outputPath) {
    console.log('📌 STEP 3: Converting GIF to MP4...');
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .on('end', () => {
                console.log('✅ Conversion complete:', outputPath);
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ ffmpeg error:', err);
                reject(err);
            })
            .run();
    });
}

async function uploadToCatbox(filePath) {
    console.log('📌 STEP 4: Uploading to Catbox...');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders() }
    });

    console.log('✅ Catbox Response:', response.data);
    return response.data;
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;
        if (!text) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} haikal*_`
            }, { quoted: message });
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        console.log('📌 STEP 1: Fetching brat-animated...');
        const encodedText = encodeURIComponent(text.trim());
        const bratUrl = `https://elrayyxml.vercel.app/maker/brat-animated?text=${encodedText}&delay=600`;

        const response = await fetch(bratUrl);
        if (!response.ok) throw new Error('Gagal mengambil animasi dari bratvid API.');

        const buffer = await response.buffer();

        const tmpFolder = ensureTmpFolder();
        const gifPath = path.join(tmpFolder, `brat_${Date.now()}.gif`);
        const mp4Path = gifPath.replace('.gif', '.mp4');
        fs.writeFileSync(gifPath, buffer);

        await convertGifToMp4(gifPath, mp4Path);

        const uploadedUrl = await uploadToCatbox(mp4Path);
        const encodedUrl = encodeURIComponent(uploadedUrl);

        console.log('📌 STEP 5: Calling Remini API...');
        const reminiApi = `https://api.alyachan.dev/api/remini-video?video=${encodedUrl}&apikey=brziko`;
        const { data } = await axios.get(reminiApi);

        console.log('✅ Remini API response:', data);
        if (!data?.status || !data?.data?.url) {
            throw new Error('Gagal mengambil hasil HD dari Remini.');
        }

        console.log('📌 STEP 6: Fetching HD result...');
        const hdBuffer = await fetch(data.data.url).then(res => res.buffer());

        console.log('📌 STEP 7: Sending as sticker...');
        await sendImageAsSticker(sock, remoteJid, hdBuffer, {
            packname: config.sticker_packname,
            author: config.sticker_author,
        }, message);

        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

        // Cleanup
        fs.unlinkSync(gifPath);
        fs.unlinkSync(mp4Path);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `⚠️ Terjadi kesalahan:\n\n\`\`\`${error.message}\`\`\``,
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['brathd'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};