const { downloadContentFromMessage } = require('baileys');
const { writeFile } = require('fs/promises');

async function downloadMediaMessage(m) {
    try {
        const mtype = Object.keys(m.message)[0];
        const stream = await downloadContentFromMessage(m.message[mtype], mtype === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error("Gagal download media:", error);
        return null;
    }
}

module.exports = {
    downloadMediaMessage
};