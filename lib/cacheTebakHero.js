const fs = require('fs');
const path = './cache/tebakheroml.json';

function loadCache() {
    if (!fs.existsSync(path)) return null;

    try {
        const { timestamp, data } = JSON.parse(fs.readFileSync(path));
        const now = Date.now();

        // Valid 5 menit
        if ((now - timestamp) < 5 * 60 * 1000) {
            return data;
        }
    } catch (err) {
        return null;
    }

    return null;
}

function saveCache(data) {
    const jsonData = {
        timestamp: Date.now(),
        data
    };
    fs.writeFileSync(path, JSON.stringify(jsonData, null, 2));
}

module.exports = { loadCache, saveCache };