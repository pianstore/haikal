const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(process.cwd(), 'plugins');

let cachedMenu = {};
let lastUpdate = 0;
const CACHE_INTERVAL = 30 * 1000; // 30 detik

function loadMenu() {
    const menu = {};

    fs.readdirSync(pluginsDir, { withFileTypes: true }).forEach(dirent => {
        if (!dirent.isDirectory()) return;

        const category = dirent.name.toLowerCase();
        const categoryPath = path.join(pluginsDir, dirent.name);
        const commands = [];

        fs.readdirSync(categoryPath).forEach(file => {
            const filePath = path.join(categoryPath, file);
            const relativeFilePath = path.join(category, file); // e.g. 'tools/menu.js'

            if (!file.endsWith('.js')) return;

            try {
                delete require.cache[require.resolve(filePath)];
                const plugin = require(filePath);

                // Daftar plugin yang boleh tampilkan semua Commands
                const allowAllCommands = [
                    'anime/anime.js',
                    'berita/berita.js',
                    'random/random image.js',
                    'random/random text.js',
                    'textpro/textpro.js',
                    'textpro/textpro 2.js',
                    'ai/ttstokoh.js'
                ];

                if (plugin.Commands && Array.isArray(plugin.Commands) && plugin.Commands.length > 0) {
                    if (allowAllCommands.includes(relativeFilePath)) {
                        commands.push(...plugin.Commands); // tampilkan semua
                    } else {
                        commands.push(plugin.Commands[0]); // hanya satu
                    }
                }
            } catch (err) {
                console.error(`❌ Gagal load file ${filePath}:`, err.message);
            }
        });

        if (commands.length > 0) {
            menu[category] = [...new Set(commands)];
        }
    });

    return menu;
}

function updateCacheIfNeeded() {
    const now = Date.now();
    if (now - lastUpdate > CACHE_INTERVAL) {
        cachedMenu = loadMenu();
        lastUpdate = now;
    }
}

const menu = new Proxy({}, {
    get(target, prop) {
        updateCacheIfNeeded();
        return cachedMenu[prop];
    },
    ownKeys() {
        updateCacheIfNeeded();
        return Reflect.ownKeys(cachedMenu);
    },
    getOwnPropertyDescriptor() {
        updateCacheIfNeeded();
        return {
            enumerable: true,
            configurable: true
        };
    }
});

module.exports = menu;