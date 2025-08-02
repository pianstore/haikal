let cache = null;
let lastUpdated = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 menit

function loadCache() {
    const now = Date.now();
    if (cache && (now - lastUpdated) < CACHE_DURATION) {
        return cache;
    } else {
        return null;
    }
}

function saveCache(data) {
    cache = data;
    lastUpdated = Date.now();
}

module.exports = {
    loadCache,
    saveCache
};