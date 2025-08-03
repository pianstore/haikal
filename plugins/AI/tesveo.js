const axios = require('axios');
const crypto = require('crypto');
const { reply } = require('@lib/utils');

async function veo3(prompt, model = 'veo-3-fast', auto_sound = false, auto_speech = false) {
    const allowedModels = ['veo-3-fast', 'veo-3'];
    if (!prompt) throw new Error('Prompt wajib diisi!');
    if (!allowedModels.includes(model)) throw new Error(`Model tersedia: ${allowedModels.join(', ')}`);
    if (typeof auto_sound !== 'boolean') throw new Error('auto_sound harus boolean');
    if (typeof auto_speech !== 'boolean') throw new Error('auto_speech harus boolean');

    const { data: cf } = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
        params: {
            mode: 'turnstile-min',
            siteKey: '0x4AAAAAAAdJZmNxW54o-Gvd',
            url: 'https://lunaai.video/features/v3-fast',
            accessKey: '5238b8ad01dd627169d9ac2a6c843613d6225e6d77a6753c75dc5d3f23813653'
        }
    });

    const uid = crypto.createHash('md5').update(Date.now().toString()).digest('hex');

    const { data: task } = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
        prompt,
        imgUrls: [],
        quality: '720p',
        duration: 8,
        autoSoundFlag: auto_sound,
        soundPrompt: '',
        autoSpeechFlag: auto_speech,
        speechPrompt: '',
        speakerId: 'Auto',
        aspectRatio: '16:9',
        secondaryPageId: 1811,
        channel: 'VEO3',
        source: 'lunaai.video',
        type: 'features',
        watermarkFlag: true,
        privateFlag: true,
        isTemp: true,
        vipFlag: true,
        model
    }, {
        headers: {
            uniqueid: uid,
            verify: cf.result.token
        }
    });

    while (true) {
        const { data } = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${task.data.recordId}`, {
            headers: {
                uniqueid: uid,
                verify: cf.result.token
            }
        });

        if (data.data.state === 'success') return JSON.parse(data.data.completeData);
        await new Promise(res => setTimeout(res, 1000));
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content?.trim()) {
            return await reply(m, `⚠️ Gunakan: ${prefix + command} <prompt>\n\nContoh: ${prefix + command} a woman relaxing on the beach`);
        }

        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const result = await veo3(content.trim(), 'veo-3', false, false);
        const videoUrl = result?.data?.video_results?.[0]?.video_url;

        if (videoUrl) {
            await sock.sendMessage(
                remoteJid,
                { video: { url: videoUrl }, caption: '*✅ Video berhasil dibuat!*' },
                { quoted: message }
            );
        } else {
            await reply(m, `❌ Gagal. Respons tidak mengandung video_url:\n${JSON.stringify(result)}`);
        }

    } catch (error) {
        console.error('PLUGIN VEO3 ERROR:', error);
        await reply(m, `❌ ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['tesveo'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1
};