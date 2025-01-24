const { run } = require('shannz-playwright');

const handleIgram = async (nvdia, msg, url) => {
    const code = `const { chromium, devices } = require('playwright');
async function igdl(url) {
    try {
        const device = devices['iPhone 12'];
        const browser = await chromium.launch();
        const context = await browser.newContext({ ...device });
        const page = await context.newPage();
        await page.goto('https://igram.world');
        await page.fill('#search-form-input', "${url}");
        await page.click('.search-form__button');
        await page.waitForTimeout(2000);
        const results = await page.evaluate(() => {
            const outputList = document.querySelector('.output-list');
            if (!outputList) return null;
            
            const items = Array.from(outputList.querySelectorAll('.output-list__item'));
            const images = [];
            const videos = [];
            items.forEach(item => {
                const imageElement = item.querySelector('.media-content__image');
                const imageUrl = imageElement ? imageElement.src : null;
                const downloadButton = item.querySelector('.button--filled.button__download');
                const videoUrl = downloadButton ? downloadButton.href : null;
                if (imageUrl) {
                    if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png') || imageUrl.endsWith('.webp')) {
                        images.push(imageUrl);
                    }
                }
                if (videoUrl && !videoUrl.endsWith('.jpg') && !videoUrl.endsWith('.png') && !videoUrl.endsWith('.webp')) {
                    videos.push(videoUrl);
                }
            });
            
            const captionElement = outputList.querySelector('.output-list__caption p');
            const uploadInfo = outputList.querySelector('.output-list__info');
            
            return {
                images,
                videos,
                caption: captionElement ? captionElement.innerText : '',
                comments: Array.from(outputList.querySelectorAll('.output-list__comments li')).map(comment => ({
                    username: comment.querySelector('.output-list__comments-username a')?.innerText || '',
                    text: comment.querySelector('p:not(.output-list__comments-username)')?.innerText || ''
                })),
                uploadDate: uploadInfo?.querySelector('.output-list__info-time')?.getAttribute('title') || '',
                likes: uploadInfo?.querySelector('.output-list__info-like')?.innerText || '0',
                commentsCount: uploadInfo?.querySelector('.output-list__info-comment')?.innerText || '0'
            };
        });
        
        await browser.close();
        return results;
    } catch (error) {
        console.error('Error in igdl:', error);
        throw error;
    }
}

igdl("${url}").then(result => {
    if (result) {
        console.log(JSON.stringify(result));
    } else {
        console.log(JSON.stringify({ error: 'No content found' }));
    }
}).catch(error => {
    console.log(JSON.stringify({ error: error.message }));
});`;
    
    try {
        if (!url) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: 'Masukan URL Instagram!\nContoh: !ig https://www.instagram.com/p/xxxxx',
                quoted: msg
            });
            return;
        }

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⏳ Mohon tunggu sebentar...',
            quoted: msg
        });

        const start = await run('javascript', code);
        let result;
        
        try {
            // Parse the output, removing any console.log lines that might appear before the JSON
            const output = start.result.output.split('\n').pop();
            result = JSON.parse(output);
            
            if (result.error) {
                throw new Error(result.error);
            }
        } catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('Gagal memproses hasil unduhan');
        }

        if (!result || (!result.images?.length && !result.videos?.length)) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Tidak dapat mengunduh konten. Pastikan URL valid dan konten dapat diakses.',
                quoted: msg
            });
            return;
        }

        const caption = `📥 *Instagram Downloader*\n\n` +
                       `📝 *Caption:* ${result.caption || 'No caption'}\n` +
                       `❤️ *Likes:* ${result.likes || '0'}\n` +
                       `💬 *Comments:* ${result.commentsCount || '0'}\n` +
                       `📅 *Upload Date:* ${result.uploadDate || 'Unknown'}\n\n` +
                       `_Downloading media..._`;

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: caption,
            quoted: msg
        });

        // Send images
        if (result.images?.length > 0) {
            for (const imageUrl of result.images) {
                await nvdia.sendMessage(msg.key.remoteJid, {
                    image: { url: imageUrl },
                    caption: '📸 Instagram Image'
                });
            }
        }

        // Send videos
        if (result.videos?.length > 0) {
            for (const videoUrl of result.videos) {
                await nvdia.sendMessage(msg.key.remoteJid, {
                    video: { url: videoUrl },
                    caption: '🎥 Instagram Video'
                });
            }
        }

    } catch (error) {
        console.error('Error in Instagram downloader:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message}\nSilakan coba lagi.`,
            quoted: msg
        });
    }
};

module.exports = { handleIgram };