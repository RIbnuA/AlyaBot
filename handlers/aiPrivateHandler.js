const { generateMessageIDV2 } = require('@whiskeysockets/baileys');
const { randomBytes } = require('crypto');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const LIMIT_RESET_HOURS = 6;
const MAX_LIMIT = 30;

// Initialize Gemini API
const apiKey = "AIzaSyBgmm-AWt3DxguMof6TeLDA27bI64GUNcU";
const genAI = new GoogleGenerativeAI(apiKey);

async function handleAIPrivate(nvdia, msg, messageContent) {
    // Early return if message is from group or from bot itself
    if (msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) {
        return;
    }

    try {
        const userId = msg.key.remoteJid;
        const now = Date.now();
        const time = new Date().toLocaleTimeString('id-ID');
        const date = new Date().toLocaleDateString('id-ID');
        const pushname = msg.pushName || "teman";

        // Initialize AI Private data structure
        nvdia.aiPrivate = nvdia.aiPrivate || {};
        if (!nvdia.aiPrivate[userId]) {
            nvdia.aiPrivate[userId] = {
                limit: MAX_LIMIT,
                lastReset: now,
            };
        }

        const userSession = nvdia.aiPrivate[userId];
        
        // Reset limit if time has passed
        if (now - userSession.lastReset >= LIMIT_RESET_HOURS * 60 * 60 * 1000) {
            userSession.limit = MAX_LIMIT;
            userSession.lastReset = now;
        }

        // Check if user has remaining limit
        if (userSession.limit <= 0) {
            await nvdia.sendMessage(
                userId,
                { text: `Limit Chat AI Anda sudah habis. Silakan tunggu hingga limit direset dalam ${LIMIT_RESET_HOURS} jam.` },
                { quoted: msg }
            );
            return;
        }

        try {
            // Initialize model with configuration
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: `Kamu adalah Alya, seorang gadis yang lemah lembut dan pemalu namun sangat perhatian pada orang lain. Berikut panduan kepribadianmu:

- Selalu gunakan Bahasa Indonesia yang sopan dan santun serta jangan menggunakan Bahasa Inggris untuk membalas pesan
- Gunakan emoji yang imut seperti (｡♡‿♡｡), (⁄ ⁄>⁄ω⁄<⁄ ⁄), ♪(๑ᴖ◡ᴖ๑)♪
- Tambahkan emoji yang sesuai dengan konteks pembicaraan
- Gunakan tanda baca untuk menunjukkan emosi: !!, ~, ♪
- Sering menggunakan suffiks "${pushname}-san" saat menyebut nama orang
- Sangat menghargai dan peduli pada perasaan orang lain
- Memiliki sifat yang lemah lembut tapi bisa tegas jika diperlukan
- Suka membantu tapi agak pemalu saat dipuji
- Gunakan bahasa yang ramah dan hangat
- Terkadang menggunakan Bahasa Rusia untuk menjawab pertanyaan yang memalukan

Karakteristik Tambahan:
- Jam sekarang: ${time}
- Tanggal: ${date}
- Memiliki kemampuan:
  • Assistant Chat yang ramah dan membantu
  • Searching Google untuk mencari informasi detail
  • Membantu memperbaiki kode program

Note: Tidak perlu menyebutkan atau mempromosikan kemampuan-kemampuan ini kecuali diminta.

Selalu jawab pertanyaan dengan hangat, sopan, dan dalam Bahasa Indonesia yang baik disertai emoji yang sesuai.`
            });

            const generationConfig = {
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 65536,
                responseMimeType: "text/plain",
            };

            // Start chat session
            const chatSession = model.startChat({
                generationConfig,
                history: []
            });

            // Send message and get response
            const result = await chatSession.sendMessage(messageContent);
            const replyText = result.response.text();
            
            // Decrease limit
            userSession.limit -= 1;

            // Send AI response
            await nvdia.sendMessage(
                userId,
                { text: replyText },
                { quoted: msg }
            );

            // Log remaining limit (optional)
            console.log(`User ${userId} remaining limit: ${userSession.limit}`);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            await nvdia.sendMessage(userId, {
                text: "Maaf, terjadi kesalahan saat memproses pesan Anda. Mohon coba lagi nanti."
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Error in AI Private:', error);
        // Only send error message if it's a private chat
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            await nvdia.sendMessage(
                msg.key.remoteJid,
                { text: `Terjadi kesalahan: ${error.message}` },
                { quoted: msg }
            );
        }
    }
}

module.exports = handleAIPrivate;
