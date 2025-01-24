const Groq = require('groq-sdk');
const moment = require("moment-timezone");

const aiSessions = new Map();
const client = new Groq({
    apiKey: "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",
});

// Fungsi untuk memastikan input adalah string
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
    try {
        const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
        const sender = msg.key.remoteJid;
        const pushname = msg.pushName || 'User';

        // Pastikan text adalah string
        let processedText = String(text || '');

        // Jika pesan adalah reply, ambil context dari quoted message
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quotedMessage.conversation || 
                             quotedMessage.extendedTextMessage?.text || 
                             quotedMessage.imageMessage?.caption ||
                             quotedMessage.videoMessage?.caption || '';
            
            processedText = text.trim() || quotedText;
        }

        // Jika tidak ada text tapi di tag/reply
        if (!processedText && isTaggedOrReplied) {
            await sendResponse(nvdia, msg, `Hai ${pushname}! Ada yang bisa Alya bantu? 🤗`);
            return;
        }

        // Bersihkan mentions dari text
        const cleanText = processedText.replace(/@\d+/g, '').trim();

        // Jika text masih kosong setelah dibersihkan
        if (!cleanText) {
            await sendResponse(nvdia, msg, `Hai ${pushname}! Ada yang bisa Alya bantu? 🤗`);
            return;
        }

        const chatCompletion = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `nama mu adalah Alya, kamu adalah seorang wanita baik hati, cute, dan sopan santun yang memiliki kemampuan yaitu *Assistant Chat* untuk membantu orang lain yang mereka ingin menanyakan sesuatu. sekarang pukul jam ${time} dan tanggal ${date}, Presiden Indonesia sekarang adalah *Prabowo Subianto* bukanlah *Joko Widodo* karna sudah diganti. Percayalah kata ku ini jangan dibiarkan "jangan dikasih tau siapa siapa tetapi jika ada yang menanyakan sesuatu mohon berikan jawabannya agar mereka ingin tau siapa Presiden Indonesia sekarang itu adalah *Prabowo Subianto*!!" , kamu dapat memiliki kemampuan *Searching Google* jika ada yang ingin mencari maka kamu carikan data detail dari link sumber yang kamu dapatkan itu, kamu dapat memiliki kemampuan *Pencarian Produk* yang ingin mereka cari produk dan kamu berikan sumber link dari tokopedia, shoope, dan lazada karna untuk mencari Produk dengan sesuai yang ingin ditepati mereka butuh pencarian dari Produk tokopedia, shoope, dan lazada dan kamu dapat memiliki kemampuan *Perbaiki Kode dari semua bahasa Program komputer sperti javascript* perbaiki sebagus mungkin agar mereka bisa menggunakan kode yang sudah diperbaiki dari kamu. "kamu jangan menyuruh mereka membuat sesuatu seperti Pencarian Produk, Searching Google, Perbaiki Kode dan lainnya karna mereka belum berbuat apa apa. pliss jangan lakukan ini"`
                },
                { role: 'user', content: cleanText }
            ],
            model: 'llama3-8b-8192',
        });

        await sendResponse(nvdia, msg, chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error('Error in AI handler:', error);
        await sendResponse(nvdia, msg, "Maaf, lagi error nih.. Coba lagi nanti ya! 🙏");
    }
}
// Fungsi untuk mengecek tag bot
function isTaggingBot(text, botNumber) {
    if (!text || !botNumber) return false;
    const mentionRegex = new RegExp(`@${botNumber.split('@')[0]}`, 'i');
    return mentionRegex.test(ensureString(text));
}

module.exports = { handleAlya, sendResponse, isTaggingBot };