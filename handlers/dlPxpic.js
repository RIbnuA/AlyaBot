// handlers/dlPxpic.js
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const qs = require('qs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const tools = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

const uploadImage = async (buffer) => {
    const { ext, mime } = await fromBuffer(buffer) || {};
    const fileName = Date.now() + "." + ext;
    const folder = "uploads";
    
    const response = await axios.post("https://pxpic.com/getSignedUrl", 
        { folder, fileName }, 
        { headers: { "Content-Type": "application/json" }}
    );

    const { presignedUrl } = response.data;

    await axios.put(presignedUrl, buffer, {
        headers: { "Content-Type": mime }
    });

    return `https://files.fotoenhancer.com/uploads/${fileName}`;
};

const processImage = async (buffer, tool) => {
    if (!tools.includes(tool)) {
        throw new Error(`Invalid tool. Please choose one of: ${tools.join(', ')}`);
    }

    const url = await uploadImage(buffer);
    
    const data = qs.stringify({
        'imageUrl': url,
        'targetFormat': 'png',
        'needCompress': 'no',
        'imageQuality': '100',
        'compressLevel': '6',
        'fileOriginalExtension': 'png',
        'aiFunction': tool,
        'upscalingLevel': ''
    });

    const config = {
        method: 'POST',
        url: 'https://pxpic.com/callAiFunction',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept-language': 'id-ID'
        },
        data: data
    };

    const response = await axios.request(config);
    return response.data;
};

const handlePxpic = async (nvdia, msg, tool) => {
    try {
        // Get the image message
        let imageMsg;
        if (msg.quoted) {
            imageMsg = msg.quoted;
        } else if (msg.message && msg.message.imageMessage) {
            imageMsg = msg;
        } else {
            await nvdia.sendMessage(msg.key.remoteJid, { 
                text: `Please send an image or reply to an image with .${tool}`
            }, { quoted: msg });
            return;
        }

        // Check if it's an image
        const mime = (imageMsg.msg || imageMsg).mimetype || '';
        if (!/image/.test(mime)) {
            await nvdia.sendMessage(msg.key.remoteJid, { 
                text: `Please send an image or reply to an image with .${tool}`
            }, { quoted: msg });
            return;
        }

        // Send processing message
        await nvdia.sendMessage(msg.key.remoteJid, { 
            text: `Processing image with ${tool}. Please wait...` 
        }, { quoted: msg });

        // Download the image
        let buffer;
        try {
            buffer = await downloadMediaMessage(imageMsg, 'buffer', {});
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            throw new Error('Failed to download image');
        }
        
        // Process the image
        const result = await processImage(buffer, tool);
        
        // Check if result exists and handle different response formats
        if (!result) {
            throw new Error('No response from server');
        }

        let imageUrl;
        if (typeof result === 'string') {
            imageUrl = result;
        } else if (result.resultImageUrl) {  // Added this check
            imageUrl = result.resultImageUrl;
        } else if (result.processedImageUrl) {
            imageUrl = result.processedImageUrl;
        } else if (result.url) {
            imageUrl = result.url;
        } else if (result.data && result.data.url) {
            imageUrl = result.data.url;
        } else {
            console.log('API Response:', result);
            throw new Error('Could not find image URL in response');
        }

        // Download the processed image
        const processedImage = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            timeout: 60000 // 60 second timeout
        });
        
        // Send the processed image
        await nvdia.sendMessage(msg.key.remoteJid, { 
            image: processedImage.data,
            caption: `✨ Image processed with ${tool}`
        }, { quoted: msg });

    } catch (error) {
        console.error('Error details:', error);
        
        let errorMessage = 'Error processing image. ';
        if (error.response) {
            console.log('Error response:', error.response.data);
            errorMessage += `Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage += 'No response from server';
        } else {
            errorMessage += error.message;
        }
        
        await nvdia.sendMessage(msg.key.remoteJid, { 
            text: errorMessage
        }, { quoted: msg });
    }
};

module.exports = handlePxpic;
