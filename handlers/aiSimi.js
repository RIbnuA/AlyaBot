const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Initialize database path
const dbPath = path.join(__dirname, '../database/simion.json');

// Create database folder if it doesn't exist
const dbFolder = path.join(__dirname, '../database');
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Create simion.json if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '[]', 'utf8');
}

// Load database
const loadSimiDB = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading simi database:', error);
        return [];
    }
};

// Save to database
const saveSimiDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving simi database:', error);
        return false;
    }
};

// Handle Simi settings
const handleSimiSettings = async (nvdia, msg, sender, args, prefixUsed, command) => {
    const simion = loadSimiDB();
    const isSimiActive = msg.isGroup ? simion.includes(sender) : false;

    if (!args.length) {
        await reply(nvdia, msg, `Pilih on atau off\nContoh: ${prefixUsed + command} on`);
        return;
    }

    switch (args[0].toLowerCase()) {
        case 'on': {
            if (isSimiActive) {
                await reply(nvdia, msg, 'Simi sudah aktif di grup ini');
                return;
            }
            simion.push(sender);
            if (saveSimiDB(simion)) {
                // Get group info if it's a group chat
                if (msg.isGroup) {
                    try {
                        const groupMetadata = await nvdia.groupMetadata(sender);
                        await nvdia.sendMessage(sender, {
                            text: '```「 ⚠️Warning⚠️ 」```\n\nSimi Online!',
                            mentions: groupMetadata.participants.map(p => p.id)
                        }, { quoted: msg });
                    } catch (error) {
                        console.error('Error getting group metadata:', error);
                    }
                }
                await reply(nvdia, msg, 'Berhasil mengaktifkan Simi di grup ini');
            }
            break;
        }
        case 'off': {
            if (!isSimiActive) {
                await reply(nvdia, msg, 'Simi sudah nonaktif di grup ini');
                return;
            }
            const index = simion.indexOf(sender);
            simion.splice(index, 1);
            if (saveSimiDB(simion)) {
                await reply(nvdia, msg, 'Berhasil menonaktifkan Simi di grup ini');
            }
            break;
        }
        default: {
            await reply(nvdia, msg, `Pilihan tidak valid\nContoh: ${prefixUsed + command} on\nContoh: ${prefixUsed + command} off`);
        }
    }
};

// Handle Simi chat
const handleSimiChat = async (nvdia, msg, text) => {
    const simion = loadSimiDB();
    const sender = msg.key.remoteJid;
    const isSimiActive = msg.isGroup ? simion.includes(sender) : false;

    if (isSimiActive) {
        try {
            const languageCode = 'id';
            const simsimiKey = ''; // Masukkan API key Anda di sini
            
            const response = await axios.post('https://api.simsimi.vn/v1/simtalk', 
                `text=hm ${encodeURIComponent(text)}&lc=${languageCode}&key=${simsimiKey}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data && response.data.message) {
                await nvdia.sendMessage(sender, { 
                    text: response.data.message 
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Error in Simi chat:', error);
            await reply(nvdia, msg, 'Terjadi kesalahan saat berkomunikasi dengan SimSimi.');
        }
    }
};

// Helper function for replies
const reply = async (nvdia, msg, replyText) => {
    if (msg.key && msg.key.remoteJid) {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: replyText,
            quoted: msg
        });
    }
};

module.exports = {
    handleSimiSettings,
    handleSimiChat
};