const axios = require('axios');
const { generateMessageIDV2 } = require('@whiskeysockets/baileys');
const { randomBytes } = require('crypto');

const LIMIT_RESET_HOURS = 6;
const MAX_LIMIT = 30;

async function handleAIPrivate(nvdia, msg, messageContent) {
    // Early return jika pesan dari grup atau dari bot sendiri
    if (msg.key.remoteJid.endsWith('@g.us') || msg.key.fromMe) {
        return;
    }

    try {
        const userId = msg.key.remoteJid;
        const now = Date.now();

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

        // Handle AI response
        const isImageRequest = /(gambar|buat gambar|generate gambar)/i.test(messageContent);
        
        if (isImageRequest) {
            const textPrompt = messageContent.replace(/(gambar|buat gambar|generate gambar)/i, "").trim();
            const urlImg = `https://btch.us.kg/dalle?text=${encodeURIComponent(textPrompt)}`;

            try {
                await nvdia.sendMessage(userId, {
                    image: { url: urlImg },
                    caption: `Hasil gambar untuk: ${textPrompt || "tanpa deskripsi"}`
                }, { quoted: msg });
            } catch (error) {
                console.error('Error generating image:', error);
                await nvdia.sendMessage(userId, {
                    text: "Terjadi kesalahan saat membuat gambar."
                }, { quoted: msg });
            }
        } else {
            const apiUrl = `https://gemini-api-5k0h.onrender.com/gemini/chat`;
            const params = { q: messageContent };

            try {
                const response = await axios.get(apiUrl, { params });
                const replyText = response.data?.content || 'Gagal mendapatkan respons AI.';
                
                // Decrease limit
                userSession.limit -= 1;

                // Send AI response
                const theArray = [
                    {
                        attrs: { biz_bot: '1' },
                        tag: "bot"
                    },
                    {
                        attrs: {},
                        tag: "biz"
                    }
                ];
                
                const gen = {
                    conversation: replyText,
                    messageContextInfo: {
                        messageSecret: randomBytes(32),
                        supportPayload: JSON.stringify({
                            version: 1,
                            is_ai_message: true,
                            should_show_system_message: true,
                            ticket_id: "1669945700536053",
                        }),
                    },
                };

                await nvdia.relayMessage(userId, gen, {
                    messageId: generateMessageIDV2(nvdia.user.id),
                    additionalNodes: theArray
                });

                // Log remaining limit (optional)
                console.log(`User ${userId} remaining limit: ${userSession.limit}`);
                
            } catch (error) {
                console.error('Error getting AI response:', error);
                await nvdia.sendMessage(userId, {
                    text: "Maaf, terjadi kesalahan saat memproses pesan Anda."
                }, { quoted: msg });
            }
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