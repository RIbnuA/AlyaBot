const axios = require('axios');

const handleFacebook = async (nvdia, msg, url) => {
    try {
        if (!url) {
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: 'Masukan URL Facebook!\nContoh: !fb https://www.facebook.com/watch?v=xxxxx',
                quoted: msg
            });
            return;
        }

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⏳ Mohon tunggu sebentar...',
            quoted: msg
        });

        // Using the provided API
        const response = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
        
        if (!response.data?.data?.video) {
            throw new Error('Video tidak ditemukan');
        }

        // Send the video
        await nvdia.sendMessage(msg.key.remoteJid, {
            video: { url: response.data.data.video },
            caption: '📥 Video Facebook berhasil diunduh',
            mimetype: 'video/mp4'
        });

    } catch (error) {
        console.error('Error in Facebook downloader:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message}\nSilakan coba lagi.`,
            quoted: msg
        });
    }
};

module.exports = { handleFacebook };