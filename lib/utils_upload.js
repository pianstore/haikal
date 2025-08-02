const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const path = require('path');

async function uploadMedia(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const { ext, mime } = (await fromBuffer(buffer)) || {};

        if (!['jpg', 'jpeg', 'png'].includes(ext)) {
            throw new Error("Format file tidak didukung. Gunakan JPG atau PNG.");
        }

        const form = new FormData();
        form.append("file", buffer, { filename: `tmp.${ext}`, contentType: mime });
        form.append("apikey", "APIKEY_YUDZXML");

        const response = await axios.post("https://api.betabotz.eu.org/api/tools/upload", form, {
            headers: form.getHeaders(),
        });

        if (response.data && response.data.result) {
            return {
                result: {
                    url: response.data.result
                }
            };
        } else {
            throw new Error("Gagal upload ke BetaBotz");
        }

    } catch (err) {
        console.error("UploadMedia Error:", err.message);
        return {
            result: {
                url: null
            }
        };
    }
}

module.exports = { uploadMedia };