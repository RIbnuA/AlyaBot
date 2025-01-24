const crypto = require('crypto');
const axios = require('axios');

const API_URL = 'https://www.blackbox.ai/api/chat';

const headers = {
    'User-Agent': 'Postify/1.0.0',
    'Accept': '*/*',
    'Referer': 'https://www.blackbox.ai',
    'Content-Type': 'application/json',
    'Origin': 'https://www.blackbox.ai',
    'DNT': '1',
    'Sec-GPC': '1',
    'Connection': 'keep-alive'
};

const models = {
    blackbox: {},
    'llama-3.1-405b': { mode: true, id: 'llama-3.1-405b' },
    'llama-3.1-70b': { mode: true, id: 'llama-3.1-70b' },
    'gemini-1.5-flash': { mode: true, id: 'Gemini' }
};

const defaultModels = {
    'gpt-4o': 'gpt-4o',
    'claude-3.5-sonnet': 'claude-sonnet-3.5',
    'gemini-pro': 'gemini-pro'
};

const modelConfig = {
    'gpt-4o': { maxTokens: 4096 },
    'claude-3.5-sonnet': { maxTokens: 8192 },
    'gemini-pro': { maxTokens: 8192 }
};

const getConfig = (model) => ({
    trendingAgentMode: models[model] || {},
    userSelectedModel: defaultModels[model] || undefined,
    ...(modelConfig[model] || {})
});

const cleanResponse = (response) => {
    return response
        .replace(/\$@\$(.*?)\$@\$/g, '')
        .trim();
};

const handleBlackboxChat = async (nvdia, msg, text, options = {}) => {
    try {
        const randomId = crypto.randomBytes(16).toString('hex');
        const randomUserId = crypto.randomUUID();

        const chatData = [{
            content: text,
            role: 'user'
        }];

        const requestData = {
            messages: chatData,
            id: randomId,
            userId: randomUserId,
            previewToken: null,
            codeModelMode: true,
            agentMode: {},
            ...getConfig(options.model || 'blackbox'),
            isMicMode: false,
            isChromeExt: false,
            githubToken: null,
            webSearchMode: true,
            userSystemPrompt: null,
            mobileClient: false,
            maxTokens: 100000,
            playgroundTemperature: parseFloat(options.temperature) || 0.7,
            playgroundTopP: 0.9,
            validated: "69783381-2ce4-4dbd-ac78-35e9063feabc",
        };

        // Send loading message
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: '🤖 Tunggu sebentar, sedang berpikir...'
        }, { quoted: msg });

        const response = await axios.post(API_URL, requestData, { headers });
        let textResponse = cleanResponse(response.data);

        // Handle continuous response if needed
        if (textResponse.includes("$~~~$")) {
            requestData.mode = 'continue';
            requestData.messages.push({ content: textResponse, role: 'assistant' });

            const continuousResponse = await axios.post(API_URL, requestData, { headers });
            textResponse += cleanResponse(continuousResponse.data);
        }

        // Send the response
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: textResponse,
            contextInfo: {
                externalAdReply: {
                    title: "Blackbox AI",
                    body: `Model: ${options.model || 'blackbox'}`,
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in Blackbox chat:', error);
        let errorMsg = 'Terjadi kesalahan saat berkomunikasi dengan Blackbox AI.';
        
        if (error.response) {
            errorMsg = `Error: ${error.response.status} - ${error.response.statusText}`;
        }

        await reply(nvdia, msg, errorMsg);
    }
};

const reply = async (nvdia, msg, replyText) => {
    if (msg.key && msg.key.remoteJid) {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: replyText,
            quoted: msg
        });
    }
};

module.exports = {
    handleBlackboxChat
};