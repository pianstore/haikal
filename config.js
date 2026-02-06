const moment = require('moment-timezone');

// Konfigurasi Umum
const APIKEY = 'ecantik';
const OWNER_NAME = 'ʜᴀɪᴋᴀʟ';
const NOMOR_BOT = '6281958611249';
const EMAIL = 'haikal@gmail.com';
const REGION = 'Indonesia';
const WEBSITE = '';
const MODE = 'production';
const RATE_LIMIT = 1;
const SIMILARITY = true;
const VERSION = global.version;

// Konfigurasi API EKSTERNAL
const apikey = {
    botz: 'https://api.betabotz.eu.org',
    key: 'wkwk' // Ganti dengan milikmu
};

// Export semua konfigurasi
const config = {
    APIKEY,
    apikey,
    phone_number_bot: NOMOR_BOT,
    owner_name: OWNER_NAME,
    owner_number: ['628891768169','6285256833258'],
    owner_email: EMAIL,
    owner_website: WEBSITE,
    region: REGION,
    version: VERSION,
    mode: MODE,
    rate_limit: RATE_LIMIT,
    status_prefix: true,
    prefix: ['.', '!', '#',','],
    commandSimilarity: SIMILARITY,

    sticker_packname: OWNER_NAME,
    sticker_author: `date: ${moment.tz('Asia/Jakarta').format('DD/MM/YY')}
ig: kall.v2
wa: 6285256833258`,

    bot_destination: 'group',
    type_connection: 'pairing',
    PresenceUpdate: '',
    typewelcome: '1',
    bgwelcome2: 'https://api.autoresbot.com/api/maker/bg-default',
    midnight_restart: false,
    anticall: false,
    autoread: false,
    autobackup: false,

    PANEL: {
        URL: '',
        KEY_APPLICATION: '',
        description: 'Butuh Bantuan Hubungi 6285256833258',
        SERVER_EGG: 15,
        id_location: 1,
        default_disk: 5120,
        cpu_default: 90
    },

    SPAM: {
        limit: 3,
        couldown: 10,
        warning: 3,
        action: 'both'
    },

    BADWORD: {
        warning: 3,
        action: 'both'
    }
};

module.exports = config;