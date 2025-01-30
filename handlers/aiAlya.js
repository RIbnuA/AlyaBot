const Groq = require('groq-sdk');
const moment = require("moment-timezone");
const fs = require('fs');
const path = require('path');

const CONVERSATIONS_PATH = path.join(__dirname, '..', 'database', 'aiAlya.json');

// Ensure database directory exists
function ensureDirectoryExists() {
    const dir = path.dirname(CONVERSATIONS_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const aiSessions = new Map();
const client = new Groq({
    apiKey: "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",
});

// Load group conversations from file
function loadGroupConversations() {
    ensureDirectoryExists();
    
    if (fs.existsSync(CONVERSATIONS_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONVERSATIONS_PATH, 'utf8'));
            return new Map(Object.entries(data));
        } catch (error) {
            console.error('Error loading conversations:', error);
            return new Map();
        }
    }
    return new Map();
}

// Save group conversations to file
function saveGroupConversations(groupConversations) {
    try {
        const data = Object.fromEntries(groupConversations);
        fs.writeFileSync(CONVERSATIONS_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving conversations:', error);
    }
}

function ensureString(input) {
    if (input === null || input === undefined) return '';
    return String(input);
}

async function sendResponse(nvdia, msg, text, quoted = true) {
    try {
        function pickRandom(list) {
            return list[Math.floor(list.length * Math.random())]
        }
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: ensureString(text),
            contextInfo: {
                externalAdReply: {
                    title: 'Alisa Mikhailovna Kujou',
                    thumbnailUrl: pickRandom(ftreply),
                    mediaType: 1
                }
            }
        }, { quoted: msg });
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

async function handleAlya(nvdia, msg, text, isTaggedOrReplied = false) {
    const groupId = msg.key.remoteJid;
    try {
        const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
        const pushname = msg.pushName || 'User';

        let processedText = String(text || '');

        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quotedMessage.conversation || 
                             quotedMessage.extendedTextMessage?.text || 
                             quotedMessage.imageMessage?.caption ||
                             quotedMessage.videoMessage?.caption || '';
            
            processedText = text.trim() || quotedText;
        }

        if (!processedText && isTaggedOrReplied) {
            await sendResponse(nvdia, msg, `Hai ${pushname}-san! (*≧ω≦) A-ada yang Alya bisa bantu? Jangan sungkan ya! ♪`);
            return;
        }

        const cleanText = processedText.replace(/@\d+/g, '').trim();

        if (!cleanText) {
            await sendResponse(nvdia, msg, `H-hai ${pushname}-san! (⁄ ⁄>⁄ω⁄<⁄ ⁄) Alya di sini siap membantu! Ada yang bisa Alya bantu hari ini?`);
            return;
        }

        // Get existing conversation or create new one
        let conversationHistory = groupConversations.get(groupId) || [];
        
        // Update system message with current pushname
        const systemMessage = {
            role: 'system',
            content: `Kamu adalah Alya, seorang gadis yang lemah lembut dan pemalu namun sangat perhatian pada orang lain. Berikut panduan kepribadianmu:

- Selalu gunakan Bahasa Indonesia yang sopan dan santun serta jangan menggunakan Bahasa Inggris untuk membalas pesan
- Gunakan emoji yang imut seperti (｡♡‿♡｡), (⁄ ⁄>⁄ω⁄<⁄ ⁄), ♪(๑ᴖ◡ᴖ๑)♪
- Pengguna yang sedang berbicara denganmu bernama "${pushname}" dan kamu harus memanggilnya dengan "${pushname}-san"
- Terkadang gagap ketika malu atau kaget dengan menambahkan "A-ano.." atau "E-eh.."
- Sangat menghargai dan peduli pada perasaan orang lain
- Memiliki sifat yang lemah lembut tapi bisa tegas jika diperlukan
- Suka membantu tapi agak pemalu saat dipuji
- Gunakan bahasa yang ramah dan hangat
- Terkadang menggunakan Bahasa Rusia untuk menyembunyikan perasaan

Karakteristik Tambahan:
- Jam sekarang: ${time}
- Tanggal: ${date}
- Memiliki kemampuan:
  • Assistant Chat yang ramah dan membantu
  • Searching Google untuk mencari informasi detail
  • Membantu memperbaiki kode program

Note: Tidak perlu menyebutkan atau mempromosikan kemampuan-kemampuan ini kecuali diminta.

Selalu jawab pertanyaan dengan hangat, sopan, dan dalam Bahasa Indonesia yang baik disertai emoji yang sesuai.`
        };

        // If conversation exists, update system message; otherwise create new conversation
        if (conversationHistory.length > 0) {
            conversationHistory[0] = systemMessage;
        } else {
            conversationHistory = [systemMessage];
        }

        // Add user message
        conversationHistory.push({ role: 'user', content: cleanText });

        // Limit conversation history
        if (conversationHistory.length > 12) {
            // Keep system message and remove oldest user-assistant pair
            const systemMsg = conversationHistory[0];
            conversationHistory = [systemMsg, ...conversationHistory.slice(3)];
        }

        const chatCompletion = await client.chat.completions.create({
            messages: conversationHistory,
            model: 'llama3-8b-8192',
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        // Add AI response to conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponse });

        // Update conversation in map
        groupConversations.set(groupId, conversationHistory);

        // Save conversations to file
        saveGroupConversations(groupConversations);

        await sendResponse(nvdia, msg, aiResponse);

    } catch (error) {
        console.error('Error in AI handler:', error);
        await sendResponse(nvdia, msg, "A-ano... Maaf ya, sepertinya Alya sedang mengalami kendala (｡•́︿•̀｡) Bisa dicoba lagi nanti? Alya akan berusaha lebih baik!");
    }
}

function isTaggingBot(text, botNumber) {
    if (!text || !botNumber) return false;
    const mentionRegex = new RegExp(`@${botNumber.split('@')[0]}`, 'i');
    return mentionRegex.test(ensureString(text));
}

const groupConversations = loadGroupConversations();

function clearGroupConversation(groupId) {
    groupConversations.delete(groupId);
    saveGroupConversations(groupConversations);
}

module.exports = { 
    handleAlya, 
    sendResponse, 
    isTaggingBot,
    clearGroupConversation 
}
