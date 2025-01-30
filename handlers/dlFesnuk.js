const axios = require('axios');
const { getBuffer } = require('../App/function/myfunc');

async function downloadFacebook(url) {
    try {
        // Use the ryzendesu API
        const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`);

        if (!response.data || !response.data.data || response.data.data.length === 0) {
            throw new Error('No video data found');
        }

        const videoData = response.data.data;
        
        // Get HD version if available, otherwise SD
        const hdVideo = videoData.find(v => v.resolution === '720p (HD)');
        const sdVideo = videoData.find(v => v.resolution === '360p (SD)');
        const selectedVideo = hdVideo || sdVideo;

        if (!selectedVideo || !selectedVideo.url) {
            throw new Error('No valid download URL found');
        }

        return {
            title: 'Facebook Video', // API doesn't provide title
            quality: selectedVideo.resolution,
            thumbnail: selectedVideo.thumbnail,
            url: selectedVideo.url
        };

    } catch (error) {
        console.error('Error in downloadFacebook:', error);
        throw new Error(error.message || 'Failed to process video');
    }
}

async function handleFacebookDownload(nvdia, msg, url) {
    const sender = msg.key.remoteJid;
    
    try {
        // Send initial processing message
        const processingMsg = await nvdia.sendMessage(sender, { 
            text: '⏳ Processing your Facebook video download request...' 
        });

        console.log('Starting Facebook video download for URL:', url);

        // Get video information and download link
        const videoInfo = await downloadFacebook(url);
        
        // Send download status
        await nvdia.sendMessage(sender, { 
            text: `?? Video found in ${videoInfo.quality}! Downloading...`,
        }, { quoted: processingMsg });

        console.log('Downloading video from URL:', videoInfo.url);

        // Get video buffer
        const videoBuffer = await getBuffer(videoInfo.url);

        console.log('Video downloaded successfully, sending to user');

        // Send the video
        await nvdia.sendMessage(sender, { 
            video: videoBuffer,
            caption: `*Facebook Video Downloader*\n\n` +
                    `*Quality:* ${videoInfo.quality}`,
            mimetype: 'video/mp4'
        }, { quoted: msg });

    } catch (error) {
        console.error('Facebook download handler error:', error);
        await nvdia.sendMessage(sender, { 
            text: `❌ Download failed: ${error.message}`
        }, { quoted: msg });
    }
}

module.exports = { handleFacebookDownload };
