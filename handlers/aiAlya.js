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

const client = new Groq({
    apiKey: "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",
});
const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');

// Struktur data sesi yang lebih baik
class ConversationSession {
    constructor(groupId) {
        this.groupId = groupId;
        this.messages = [];
        this.lastActivity = Date.now();
    }

    getBaseSystemMessage() {
        return `Kamu adalah Alya, seorang gadis yang lemah lembut dan pemalu namun sangat perhatian pada orang lain. Berikut panduan kepribadianmu:

- Selalu gunakan Bahasa Indonesia yang sopan dan santun serta jangan menggunakan Bahasa Inggris untuk membalas pesan
- Gunakan emoji yang imut seperti (｡♡‿♡｡), (⁄ ⁄>⁄ω⁄<⁄ ⁄), ♪(๑ᴖ◡ᴖ๑)♪
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

Selalu jawab pertanyaan dengan hangat, sopan, dan dalam Bahasa Indonesia yang baik disertai emoji yang sesuai.

PENTING: Gunakan {name} untuk menyebut nama pengguna, contoh: "Hai {name}-san!"`;
    }

    // Prepare messages for storage by replacing actual names with placeholder
    sanitizeMessageForStorage(message) {
        if (typeof message.content === 'string') {
            // Replace any name patterns (e.g., "John-san") with placeholder
            message.content = message.content.replace(/[\w\s]+-san/g, '{name}-san');
        }
        return message;
    }

    // Prepare messages for AI by adding current username context
    prepareMessagesForAI(messages, currentUser) {
        return messages.map(msg => {
            if (msg.role === 'system') {
                return {
                    ...msg,
                    content: `${this.getBaseSystemMessage()}\n\nGunakan "${currentUser}" sebagai {name} dalam setiap respons.`
                };
            }
            return msg;
        });
    }

    addMessage(role, content, currentUser = null) {
        // Sanitize content before storage
        let sanitizedContent = content;
        if (role === 'assistant') {
            sanitizedContent = content.replace(new RegExp(`${currentUser}-san`, 'g'), '{name}-san');
        }

        const message = this.sanitizeMessageForStorage({
            role,
            content: sanitizedContent
        });

        this.messages.push(message);
        this.lastActivity = Date.now();
        
        // Limit conversation history
        if (this.messages.length > 11) {
            const systemMessage = this.messages[0];
            this.messages = [systemMessage, ...this.messages.slice(-10)];
        }
    }

    getMessages(currentUser) {
        return this.prepareMessagesForAI(this.messages, currentUser);
    }
}

// Load sessions from file
function loadSessions() {
    ensureDirectoryExists();
    
    if (fs.existsSync(CONVERSATIONS_PATH)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONVERSATIONS_PATH, 'utf8'));
            const sessions = new Map();
            
            for (const [groupId, sessionData] of Object.entries(data)) {
                const session = new ConversationSession(groupId);
                session.messages = sessionData.messages || [];
                session.lastActivity = sessionData.lastActivity || Date.now();
                sessions.set(groupId, session);
            }
            
            return sessions;
        } catch (error) {
            console.error('Error loading sessions:', error);
            return new Map();
        }
    }
    return new Map();
}

// Initialize aiSessions
let aiSessions = loadSessions();

// Save sessions to file
function saveSessions(sessions) {
    try {
        const data = {};
        for (const [groupId, session] of sessions) {
            data[groupId] = {
                messages: session.messages,
                lastActivity: session.lastActivity
            };
        }
        fs.writeFileSync(CONVERSATIONS_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving sessions:', error);
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
        const pushname = msg.pushName || 'User';

        // Get or create session
        let session = aiSessions.get(groupId);
        if (!session) {
            session = new ConversationSession(groupId);
            session.messages.push({
                role: 'system',
                content: session.getBaseSystemMessage()
            });
            aiSessions.set(groupId, session);
        }

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
            const response = `Hai {name}-san! (*≧ω≦) A-ada yang Alya bisa bantu? Jangan sungkan ya! ♪`.replace('{name}', pushname);
            await sendResponse(nvdia, msg, response);
            return;
        }

        const cleanText = processedText.replace(/@\d+/g, '').trim();

        if (!cleanText) {
            const response = `H-hai {name}-san! (⁄ ⁄>⁄ω⁄<⁄ ⁄) Alya di sini siap membantu! Ada yang bisa Alya bantu hari ini?`.replace('{name}', pushname);
            await sendResponse(nvdia, msg, response);
            return;
        }

        // Add user message to session
        session.addMessage('user', cleanText);

        // Get AI response using current pushname
        const chatCompletion = await client.chat.completions.create({
            messages: session.getMessages(pushname),
            model: 'llama3-8b-8192',
        });

        let aiResponse = chatCompletion.choices[0].message.content;
        
        // Replace placeholder with actual name before sending
        aiResponse = aiResponse.replace(/\{name\}-san/g, `${pushname}-san`);

        // Store sanitized version of the response
        session.addMessage('assistant', aiResponse, pushname);

        // Save sessions
        saveSessions(aiSessions);

        // Send the response with actual name
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

function clearGroupConversation(groupId) {
    aiSessions.delete(groupId);
    saveSessions(aiSessions);
}

function ensureString(input) {
    if (input === null || input === undefined) return '';
    return String(input);
}

// Cleanup old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [groupId, session] of aiSessions) {
        if (now - session.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
            aiSessions.delete(groupId);
        }
    }
    saveSessions(aiSessions);
}, 60 * 60 * 1000); // Check every hour

module.exports = { 
    handleAlya, 
    sendResponse, 
    isTaggingBot,
    clearGroupConversation 
}
