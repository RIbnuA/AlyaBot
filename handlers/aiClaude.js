// features/aiHandler.js
const axios = require('axios');

const handleAI = async (nvdia, msg, sender, args, prefixUsed, command) => {
    if (!args.length) {
        await reply(nvdia, msg, `Masukkan pertanyaan!\ncontoh:\n\n${prefixUsed + command} halo selamat siang`);
        return;
    }

    try {
        // Send initial loading message
        const loadingMsg = await nvdia.sendMessage(sender, { 
            text: '🤖 Tunggu sebentar, sedang berpikir...'
        }, { quoted: msg });

        // Get user's question from args
        const question = args.join(' ');
        
        // Make request to Claude AI API
        const response = await axios.get(`https://api.ryzendesu.vip/api/ai/claude?text=${encodeURIComponent(question)}`);
        
        if (response.data && response.data.action === "success") {
            // Send the AI response
            await nvdia.sendMessage(sender, {
                text: response.data.response,
                contextInfo: {
                    externalAdReply: {
                        title: "Claude AI",
                        body: `Model: ${response.data.model}`,
                        mediaType: 1,
                        showAdAttribution: true
                    }
                }
            }, { quoted: msg });
        } else {
            throw new Error('Respons tidak valid dari API');
        }

    } catch (error) {
        console.error("Error pada fitur AI:", error);
        
        let errorMsg = 'Terjadi kesalahan saat memproses permintaan.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMsg = 'API tidak dapat diakses. Silakan coba lagi nanti.';
            } else if (error.response.status === 429) {
                errorMsg = 'Terlalu banyak permintaan. Mohon tunggu beberapa saat.';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await reply(nvdia, msg, errorMsg);
    }
};

const reply = async (nvdia, msg, replyText) => {
    if (msg.key && msg.key.remoteJid) {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: replyText,
            quoted: msg, 
        });
    }
};

module.exports = handleAI;