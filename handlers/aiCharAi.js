const axios = require('axios');
const qs = require('qs');

const chatbot = {
  getCharacters: async () => {
    try {
      const response = await axios.get("https://pastebin.com/raw/hX7neDQb");
      return response.data.characters;
    } catch (error) {
      console.error('Error fetching character data:', error);
      return [];
    }
  },
  instruct: (characters, name) => {
    if (!characters || !Array.isArray(characters)) {
      console.error('Karakter tidak valid atau tidak ditemukan.');
      return 'Karakter tidak ditemukan.';
    }
    const character = characters.find(char => char.name.toLowerCase() === name.toLowerCase());
    return character ? character.instruction : 'Karakter tidak ditemukan.';
  },
  chat: async (query, characterName) => {
    const characters = await chatbot.getCharacters();
    const prompt = chatbot.instruct(characters, characterName);

    const data = qs.stringify({
      'action': 'do_chat_with_ai',
      'ai_chatbot_nonce': '22aa996020',
      'ai_name': characterName,
      'origin': '',
      'instruction': prompt,
      'user_question': query
    });

    const config = {
      method: 'POST',
      url: 'https://onlinechatbot.ai/wp-admin/admin-ajax.php',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
        'accept-language': 'id-ID',
        'referer': 'https://onlinechatbot.ai/chatbots/sakura/',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'origin': 'https://onlinechatbot.ai',
        'alt-used': 'onlinechatbot.ai',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'priority': 'u=0',
        'te': 'trailers',
        'Cookie': '_ga_PKHPWJ2GVY=GS1.1.1732933582.1.1.1732933609.0.0.0; _ga=GA1.1.261902946.1732933582'
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error in chat request:', error);
      return 'Terjadi kesalahan saat menghubungi chatbot.';
    }
  },
  create: async (name, prompt, query) => {
    const data = qs.stringify({
      'action': 'do_chat_with_ai',
      'ai_chatbot_nonce': '22aa996020',
      'ai_name': name,
      'origin': '',
      'instruction': prompt,
      'user_question': query
    });

    const config = {
      method: 'POST',
      url: 'https://onlinechatbot.ai/wp-admin/admin-ajax.php',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
        'accept-language': 'id-ID',
        'referer': 'https://onlinechatbot.ai/chatbots/sakura/',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'origin': 'https://onlinechatbot.ai',
        'alt-used': 'onlinechatbot.ai',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'priority': 'u=0',
        'te': 'trailers',
        'Cookie': '_ga_PKHPWJ2GVY=GS1.1.1732933582.1.1.1732933609.0.0.0; _ga=GA1.1.261902946.1732933582'
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error in create request:', error);
      return 'Terjadi kesalahan saat menghubungi chatbot.';
    }
  },
  
  handleCharAI: async (nvdia, msg, text, isTagged = false) => {
    const sender = msg.key.remoteJid;
    
    try {
        if (!text && !isTagged) {
            await nvdia.sendMessage(sender, {
                text: 'Silakan masukkan pesan yang ingin disampaikan ke AI.\nContoh: !char Sakura Hai!'
            }, { quoted: msg });
            return;
        }

        let characterName, message;
        
        if (isTagged) {
            characterName = 'Sakura';
            message = text;
        } else {
            const parts = text.trim().split(' ');
            characterName = parts[0];
            message = parts.slice(1).join(' ');

            if (!message) {
                await nvdia.sendMessage(sender, {
                    text: `Silakan masukkan pesan untuk karakter ${characterName}.\nContoh: !char ${characterName} Hai!`
                }, { quoted: msg });
                return;
            }
        }

        await nvdia.sendPresenceUpdate('composing', sender);

        const response = await chatbot.chat(message, characterName);

        if (!response || typeof response !== 'string') {
            throw new Error('Respons tidak valid dari AI');
        }

        await nvdia.sendMessage(sender, {
            text: response
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in handleCharAI:', error);
        await nvdia.sendMessage(sender, {
            text: `Maaf, terjadi kesalahan: ${error.message}\nSilakan coba lagi nanti.`
        }, { quoted: msg });
    }
  },

  handleCharList: async (nvdia, msg) => {
    try {
        const characters = await chatbot.getCharacters();
        
        if (!characters || !Array.isArray(characters)) {
            throw new Error('Tidak dapat mengambil daftar karakter');
        }

        const characterList = characters.map(char => `- ${char.name}`).join('\n');
        const response = `*Daftar Karakter Tersedia:*\n\n${characterList}\n\nGunakan dengan format:\n!char [nama_karakter] [pesan]`;

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: response
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in handleCharList:', error);
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `Maaf, terjadi kesalahan: ${error.message}`
        }, { quoted: msg });
    }
  }
};

module.exports = { chatbot };