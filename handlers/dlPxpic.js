// handlers/dlPxpic.js
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const qs = require('qs');
const { downloadMediaMessage, getContentType } = require('@whiskeysockets/baileys');

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
        // Get the correct message object
        let quotedMsg = msg.quoted || msg;
        
        // Debug logs
        console.log('Processing message structure...');
        console.log('Message type:', getContentType(quotedMsg.message));
        console.log('Full message:', JSON.stringify(quotedMsg, null, 2));

        // Check if the message contains an image
        const hasImage = quotedMsg.mimetype?.includes('image') || 
                        msg.message?.imageMessage ||
                        quotedMsg.message?.imageMessage;

        if (!hasImage) {
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
            if (msg.quoted) {
                // For quoted messages that are direct image objects
                if (quotedMsg.url) {
                    const response = await axios.get(quotedMsg.url, {
                        responseType: 'arraybuffer'
                    });
                    buffer = Buffer.from(response.data);
                } else {
                    // Try normal download
                    buffer = await downloadMediaMessage(quotedMsg, 'buffer', {});
                }
            } else {
                // For direct messages
                buffer = await downloadMediaMessage(msg, 'buffer', {});
            }
        } catch (downloadError) {
            console.error('Download error details:', downloadError);
            throw new Error(`Failed to download image: ${downloadError.message}`);
        }

        if (!buffer) {
            throw new Error('Could not get image buffer');
        }

        // Process the image
        const result = await processImage(buffer, tool);
        
        if (!result) {
            throw new Error('No response from server');
        }

        let imageUrl;
        if (typeof result === 'string') {
            imageUrl = result;
        } else if (result.resultImageUrl) {
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
            timeout: 60000
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
