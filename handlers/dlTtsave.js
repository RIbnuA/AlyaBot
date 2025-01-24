const axios = require('axios');
const cheerio = require('cheerio');

const handleTtsave = async (nvdia, msg, url) => {
    try {
        if (!url) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: 'Masukan URL TikTok!\nContoh: !tt https://www.tiktok.com/@username/video/xxxxx',
                quoted: msg
            });
            return;
        }

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⏳ Mohon tunggu sebentar...',
            quoted: msg
        });

        const apiUrl = 'https://ttsave.app/download';
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Referer': 'https://ttsave.app/id'
        };

        const data = {
            query: url,
            language_id: "2"
        };

        const response = await axios.post(apiUrl, data, { headers });
        const $ = cheerio.load(response.data);
        
        const result = {
            uniqueId: $('#unique-id').val(),
            username: $('h2.font-extrabold').text().trim(),
            userHandle: $('a[title]').text().trim(),
            userProfileImage: $('img').attr('src'),
            description: $('p.oneliner').text().trim(),
            views: $('span:contains("K")').first().text().trim(),
            downloadLinks: {
                noWatermark: $('a[type="no-watermark"]').attr('href'),
                withWatermark: $('a[type="watermark"]').attr('href'),
                audio: $('a[type="audio"]').attr('href'),
                profileImage: $('a[type="profile"]').attr('href'),
                coverImage: $('a[type="cover"]').attr('href')
            }
        };

        if (!result.downloadLinks.noWatermark && !result.downloadLinks.withWatermark) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Tidak dapat mengunduh video. Pastikan URL valid dan video dapat diakses.',
                quoted: msg
            });
            return;
        }

        const caption = `📥 *TikTok Downloader*\n\n` +
                       `👤 *Username:* ${result.username || result.userHandle}\n` +
                       `📝 *Description:* ${result.description || 'No description'}\n` +
                       `👁️ *Views:* ${result.views || '0'}\n\n` +
                       `_Sending video..._`;

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: caption,
            quoted: msg
        });

        // Send video without watermark if available, otherwise with watermark
        const videoUrl = result.downloadLinks.noWatermark || result.downloadLinks.withWatermark;
        await nvdia.sendMessage(msg.key.remoteJid, {
            video: { url: videoUrl },
            caption: '🎥 TikTok Video',
            mimetype: 'video/mp4'
        });

        // Optionally send audio if available and requested
        if (result.downloadLinks.audio) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                audio: { url: result.downloadLinks.audio },
                mimetype: 'audio/mp4',
                fileName: `${result.uniqueId || 'tiktok'}.mp3`
            });
        }

    } catch (error) {
        console.error('Error in TikTok downloader:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message}\nSilakan coba lagi.`,
            quoted: msg
        });
    }
};

module.exports = { handleTtsave };