const fs = require('fs');
const axios = require('axios');

async function downloadFileFromUrl(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

module.exports = {
    downloadFileFromUrl
};