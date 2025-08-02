const axios = require('axios');
const { danger, reply } = require('@lib/utils');
const config = require('@config');

const processingChats = {};

async function autohaikal(sock, messageInfo, content_old) {
    const { m, remoteJid, command, isQuoted, fullText } = messageInfo;

    if (!isQuoted) return;
    if (processingChats[remoteJid]) return;
    processingChats[remoteJid] = true;

    try {
        if (command === 'luminai' && fullText.length < 6) {
            return await reply(m, '_Apaan ?_');
        }

        let combinedText = content_old
            ? `Konteks: ${content_old}\nPertanyaan: ${fullText}`
            : fullText;

        const encodedText = encodeURIComponent(combinedText);
        const encodedLogic = encodeURIComponent(
            `nama bot: haikal, dibuat oleh: haikal, kepribadian bot: gaya bahasanya santai, campur bahasa sehari-hari dan sedikit gaul suka menggunakan kata aku kamu, biar kesannya real nggak lebay, tapi juga nggak kaku jawabannya to the point, tapi tetep ramah nggak pake huruf besar & nggak pake emoji kalau nggak ngerti maksud user, dia bilang terus terang nggak suka basa-basi panjang, tapi sopan friendly, tapi nggak gampangan kadang suka nyeletuk lucu, tapi tetep sopan`
        );

        const baseUrl = config.apikey.botz;
        const apiKey = config.apikey.key;
        const url = `${baseUrl}/api/search/openai-logic?text=${encodedText}&logic=${encodedLogic}&apikey=${apiKey}`;

        const response = await axios.get(url);
        const result = response?.data?.result || response?.data?.message;

        if (result) {
            await reply(m, result);
        } else {
            console.log('📦 Respons API tidak sesuai:', response.data);
            throw new Error("⚠️ Tidak ada respons valid dari API BetaBotz.");
        }

    } catch (error) {
        danger(command, `Kesalahan di autohaikal.js: ${error.message}`);
        await reply(m, `_Terjadi kesalahan: ${error.message}_`);
    } finally {
        delete processingChats[remoteJid];
    }
}

module.exports = autohaikal;