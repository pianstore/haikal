const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}

async function createSlideshowVideo(images, outputPath, musicUrl = null) {
    const tempDir = path.join(process.cwd(), 'tmp/slideshow');
    const videoPartsDir = path.join(tempDir, 'parts');
    await fs.ensureDir(videoPartsDir);

    const downloadedFiles = [];

    for (let i = 0; i < images.length; i++) {
        const imgPath = path.join(tempDir, `img${i}.jpg`);
        const response = await axios.get(images[i].img, { responseType: 'arraybuffer' });
        await fs.writeFile(imgPath, response.data);
        downloadedFiles.push(imgPath);
    }

    if (downloadedFiles.length === 0) throw new Error("Tidak ada gambar valid.");

    // Download music
    let musicFile = null;
    let audioDuration = 10; // fallback

    if (musicUrl) {
        const musicRes = await axios.get(musicUrl, { responseType: 'arraybuffer' });
        musicFile = path.join(tempDir, 'music.mp3');
        await fs.writeFile(musicFile, musicRes.data);
        audioDuration = await getAudioDuration(musicFile);
    }

    const durationPerImage = audioDuration / downloadedFiles.length;
    const partFiles = [];

    // Buat video per gambar
    for (let i = 0; i < downloadedFiles.length; i++) {
        const img = downloadedFiles[i];
        const partOutput = path.join(videoPartsDir, `part${i}.mp4`);
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(img)
                .loop(durationPerImage)
                .videoFilters([
                    `scale=720:1280:force_original_aspect_ratio=decrease`,
                    `pad=720:1280:(ow-iw)/2:(oh-ih)/2:black`
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-t', durationPerImage.toFixed(2),
                    '-pix_fmt yuv420p',
                    '-r 25'
                ])
                .on('end', resolve)
                .on('error', reject)
                .save(partOutput);
        });
        partFiles.push(`file '${partOutput}'`);
    }

    // Gabungkan semua part
    const listFile = path.join(tempDir, 'list.txt');
    await fs.writeFile(listFile, partFiles.join('\n'));

    return new Promise((resolve, reject) => {
        let command = ffmpeg()
            .input(listFile)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions([
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-r 25'
            ]);

        if (musicFile) {
            command = command.input(musicFile).outputOptions('-shortest');
        }

        command
            .on('end', async () => {
                await fs.remove(tempDir);
                resolve(outputPath);
            })
            .on('error', async err => {
                await fs.remove(tempDir);
                reject(new Error(`ffmpeg final join error: ${err.message}`));
            })
            .save(outputPath);
    });
}

module.exports = createSlideshowVideo;