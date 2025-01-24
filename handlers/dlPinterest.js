const axios = require('axios');
const cheerio = require('cheerio');

const searchPinterest = async (query) => {
    try {
        const searchUrl = `https://id.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/17.0 Chrome/96.0.4664.104 Mobile Safari/537.36",
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        const $ = cheerio.load(response.data);
        const pins = [];
        
        // Extract all image URLs from the search results
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.includes('pinimg.com') && !src.includes('75x75_RS')) {
                pins.push({
                    url: src.replace(/\d+x\//, 'originals/'), // Try to get original size image
                    type: 'image'
                });
            }
        });

        return pins.slice(0, 5); // Return first 5 results
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
};

const handlePinterest = async (nvdia, msg, args) => {
    try {
        // Check if it's a search query or URL
        const isUrl = args.startsWith('http');
        
        if (!args) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: 'Masukan URL Pinterest atau kata kunci pencarian!\n\nContoh:\n!pin https://pin.it/xxxxx\n!pin alya',
                quoted: msg
            });
            return;
        }

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⏳ Mohon tunggu sebentar...',
            quoted: msg
        });

        // Handle search query
        if (!isUrl) {
            const results = await searchPinterest(args);
            
            if (!results.length) {
                await nvdia.sendMessage(msg.key.remoteJid, {
                    text: '❌ Tidak ada hasil ditemukan untuk pencarian tersebut.',
                    quoted: msg
                });
                return;
            }

            await nvdia.sendMessage(msg.key.remoteJid, {
                text: `📥 *Pinterest Search*\n\n🔍 Query: ${args}\n📸 Mengirim ${results.length} hasil pencarian...`,
                quoted: msg
            });

            // Send each image result
            for (const [index, pin] of results.entries()) {
                await nvdia.sendMessage(msg.key.remoteJid, {
                    image: { url: pin.url },
                    caption: `📸 Pinterest Image ${index + 1}/${results.length}`
                });
            }
            return;
        }

        // Handle URL download
        const response = await axios.get(args, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/17.0 Chrome/96.0.4664.104 Mobile Safari/537.36",
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        const $ = cheerio.load(response.data);
        const imageData = $('script[data-test-id="leaf-snippet"]').text();
        const videoData = $('script[data-test-id="video-snippet"]').text();

        if (!imageData && !videoData) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Konten tidak ditemukan. Pastikan URL valid.',
                quoted: msg
            });
            return;
        }

        const result = {
            isVideo: !!videoData,
            info: JSON.parse(imageData || '{}'),
            image: JSON.parse(imageData || '{}').image,
            video: videoData ? JSON.parse(videoData).contentUrl : ''
        };

        const caption = `📥 *Pinterest Downloader*\n\n` +
                       `📝 *Title:* ${result.info.name || 'No title'}\n` +
                       `👤 *Author:* ${result.info.author?.name || 'Unknown'}\n` +
                       `📌 *Type:* ${result.isVideo ? 'Video' : 'Image'}\n\n` +
                       `_Sending media..._`;

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: caption,
            quoted: msg
        });

        // Send media based on type
        if (result.isVideo && result.video) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                video: { url: result.video },
                caption: '🎥 Pinterest Video',
                mimetype: 'video/mp4'
            });
        } else if (result.image) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                image: { url: result.image },
                caption: '📸 Pinterest Image'
            });
        }

    } catch (error) {
        console.error('Error in Pinterest handler:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message}\nSilakan coba lagi.`,
            quoted: msg
        });
    }
};

module.exports = { handlePinterest };