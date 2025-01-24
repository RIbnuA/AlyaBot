const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function handleHDUpscale(nvdia, msg, resolutionOption, bufferImage) {
    const outputPath = './output/';
    try {
        const tempFilePath = path.join(process.cwd(), `temp_image_${Date.now()}.jpg`);
        fs.writeFileSync(tempFilePath, bufferImage);

        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        const resolutions = {
            1: { label: '1080p', width: 1920, height: 1080 },
            2: { label: '2k', width: 2560, height: 1440 },
            3: { label: '4k', width: 3840, height: 2160 },
            4: { label: '8k', width: 7680, height: 4320 },
            5: { label: '16k', width: 15360, height: 8640 },
        };

        if (!resolutions[resolutionOption]) {
            return await nvdia.sendMessage(msg.key.remoteJid, {
                text: 'Pilihan resolusi tidak valid. Pilih antara 1 - 5.',
                quoted: msg
            });
        }

        const selectedResolution = resolutions[resolutionOption];
        const outputPathResolution = path.join(outputPath, `foto-${selectedResolution.label}.jpg`);

        // Ensure image is valid before processing
        const metadata = await sharp(tempFilePath).metadata();
        
        await sharp(tempFilePath)
            .resize({
                width: Math.min(selectedResolution.width, metadata.width),
                height: Math.min(selectedResolution.height, metadata.height),
                fit: sharp.fit.inside,
                kernel: sharp.kernel.lanczos3,
            })
            .sharpen({
                sigma: 2,
                m1: 3,
                m2: 1,
            })
            .normalize()
            .modulate({
                saturation: 1.3,
                brightness: 0.85,
            })
            .toFormat('jpeg', {
                quality: 100,
                progressive: true,
            })
            .toFile(outputPathResolution);

        await nvdia.sendMessage(msg.key.remoteJid, {
            image: fs.readFileSync(outputPathResolution),
            caption: `Upscaled to ${selectedResolution.label}`
        }, { quoted: msg });

        // Cleanup
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(outputPathResolution);

    } catch (error) {
        console.error('HD Upscale Error:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `Gagal memproses gambar: ${error.message}`,
            quoted: msg
        });
    }
}

module.exports = handleHDUpscale;
