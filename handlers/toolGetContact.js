const axios = require('axios');

async function handleGetContact(nvdia, msg, args) {
    if (!args || !args.trim()) {
        return await nvdia.sendMessage(msg.key.remoteJid, {
            text: '⚠️ Masukkan nomor telepon yang valid!',
            quoted: msg
        });
    }

    try {
        let phoneNumber = args.trim();
        const url = `https://api.ryzendesu.vip/api/stalk/get-contact?number=${encodeURIComponent(phoneNumber)}`;
        
        const response = await axios.get(url);
        if (!response.data.result) {
            return await nvdia.sendMessage(msg.key.remoteJid, {
                text: '❌ Tidak ada data yang ditemukan untuk nomor tersebut.',
                quoted: msg
            });
        }

        const { name, phone, provider } = response.data.result.userData;
        const tags = response.data.result.tags || [];
        
        let message = `
?? *Informasi Kontak* ??
━━━━━━━━━━━━━━━━━━━
?? *Nama*: ${name}
?? *Nomor*: ${phone}
?? *Provider*: ${provider}

??️ *Tags*:
${tags.length ? tags.map(tag => `- ${tag}`).join('\n') : 'Tidak ada tag.'}
`.trim();
        
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: message,
            quoted: msg
        });
        
    } catch (error) {
        console.error('Error in getContact handler:', error);
        let errorMessage = '❌ Error: ';
        
        if (error.response) {
            errorMessage += error.response.status === 404 
                ? 'Data tidak ditemukan.'
                : `Gagal mengambil data! Status: ${error.response.status}`;
        } else {
            errorMessage += 'Gagal mengambil data.';
        }
        
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: errorMessage,
            quoted: msg
        });
    }
}

module.exports = handleGetContact;
