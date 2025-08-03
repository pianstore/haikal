const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Upload ke uguu.se
async function uploadUguu(buffer, filename = 'image.png') {
    const form = new FormData();
    form.append('files[]', buffer, { filename });

    const { data } = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders()
    });

    const url = data?.files?.[0]?.url;
    if (!url) throw new Error('Upload ke uguu gagal');
    return url;
}

// Hapus background via mosyne.ai
async function removeBackgroundMosyne(buffer) {
    const imageUrl = await uploadUguu(buffer);
    const headers = {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        origin: 'https://mosyne.ai',
        referer: 'https://mosyne.ai/ai/remove-bg',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)'
    };

    const user_id = 'user_test';
    const { data } = await axios.post(
        'https://mosyne.ai/api/remove_background',
        { image: imageUrl, user_id },
        { headers }
    );

    if (!data.id) throw new Error('Gagal mendapatkan ID remove bg');

    const checkPayload = { id: data.id, type: 'remove_background', user_id };

    for (let i = 0; i < 30; i++) {
        await new Promise(res => setTimeout(res, 2000));
        const { data: status } = await axios.post('https://mosyne.ai/api/status', checkPayload, { headers });

        if (status.status === 'COMPLETED' && status.image) return status.image;
        if (status.status === 'FAILED') throw new Error('Proses hapus background gagal');
    }

    throw new Error('Timeout proses hapus background');
}

// Upscale via mosyne.ai
async function upscaleMosyne(url) {
    const headers = {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        origin: 'https://mosyne.ai',
        referer: 'https://mosyne.ai/ai/upscaling',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)'
    };

    const user_id = 'user_test';
    const { data } = await axios.post(
        'https://mosyne.ai/api/upscale',
        { image: url, user_id },
        { headers }
    );

    if (!data.id) throw new Error('Gagal mendapatkan ID upscale');

    const checkPayload = { id: data.id, type: 'upscale', user_id };

    for (let i = 0; i < 30; i++) {
        await new Promise(res => setTimeout(res, 2000));
        const { data: status } = await axios.post('https://mosyne.ai/api/status', checkPayload, { headers });

        if (status.status === 'COMPLETED' && status.image) return status.image;
        if (status.status === 'FAILED') throw new Error('Upscale gagal');
    }

    throw new Error('Timeout proses upscale');
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _kirim/balas gambar dengan caption *${prefix + command}*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "🧼", key: message.key } });

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const buffer = fs.readFileSync(path.join('tmp', media));

        await reply(m, `menghapus background...`);
        const removedBgUrl = await removeBackgroundMosyne(buffer);

        await reply(m, `meningkatkan kualitas gambar tunggu sebentar...`);
        const upscaledUrl = await upscaleMosyne(removedBgUrl);

        await sock.sendMessage(remoteJid, {
            image: { url: upscaledUrl },
            caption: '✅ done *background telah dihapus* dan gambar di *HD* kan.',
        }, { quoted: message });

        fs.unlinkSync(path.join('tmp', media));
    } catch (e) {
        console.error(e);
        await reply(m, `❌ Eror: ${e?.message || e}`);
    }
}

module.exports = {
    handle,
    Commands: ['removebghd'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};