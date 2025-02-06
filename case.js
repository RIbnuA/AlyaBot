require('./settings');
const { makeWASocket, makeCacheableSignalKeyStore, downloadMediaMessage, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, PHONENUMBER_MCC, AnyMessageContent, useMultiFileAuthState, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const systeminformation = require('systeminformation');
const os = require('os');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment-timezone');
const sharp = require('sharp');
const path = require('path');
const yts = require("yt-search");
const axios = require("axios");
const ytdl = require('ytdl-core');
const { createWriteStream } = require('fs');
const { promisify, util } = require('util');
const FormData = require('form-data');
const stream = require('stream');
const quoteApi = require('@neoxr/quote-api')
const { Sticker } = require('wa-sticker-formatter')
const { addExif } = require('./App/function/exif')
const { smsg, formatDate, getTime, getGroupAdmins, formatp, await, sleep, runtime, clockString, msToDate, sort, toNumber, enumGetKey, fetchJson, getBuffer, json, delay, format, logic, generateProfilePicture, parseMention, getRandom, fetchBuffer, buffergif, GIFBufferToVideoBuffer, totalcase } = require('./App/function/myfunc'); 
const { bytesToSize, checkBandwidth, formatSize, jsonformat, nganuin, shorturl, color } = require("./App/function/funcc");
const { toAudio, toPTT, toVideo, ffmpeg, addExifAvatar } = require('./App/function/converter')
const { remini } = require('./App/remini');
const { tmpfiles, Uguu, gofile, catbox, mediaUploader, videy, caliph, doods, picu } = require('./App/uploader');
const pipeline = promisify(stream.pipeline);
const aiGroupStatus = new Map();
const { execSync } = require('child_process');
const { handleAIPrivate, replyAI } = require('./handlers/aiPrivateHandler');
const { handleAlya, isTaggingBot, sendResponse, clearGroupConversation } = require('./handlers/aiAlya');
const StateManager = require('./App/stateManager');
const { handleNext, handleStop } = require('./lib/NextStop');
const handleAI = require('./handlers/aiClaude');
const { handleAnilistSearch, handleAnilistDetail, handleAnilistPopular } = require('./handlers/aiAnilist');
const { handleAppleMusicSearch, handleAppleMusicDownload } = require('./handlers/dlAppleMusic');
const handleDownload = require('./handlers/dlAll');
const { handleTtsave } = require('./handlers/dlTtsave');
const handlePxpic = require('./handlers/dlPxpic');
const { handleIgram } = require('./handlers/dlIgram');
const handlePin = require('./handlers/dlPin');
const { handleFacebookDownload } = require('./handlers/dlFesnuk');
const handleGetContact = require('./handlers/toolGetContact');

moment.locale('id');

const searchResults = new Map();
const userStates = new Map();
const setState = (userId, state, data = null) => {
    userStates.set(userId, {
        state,
        timestamp: Date.now(),
        data
    });
};

const getState = (userId) => {
    const state = userStates.get(userId);
    if (!state) return null;

    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
        userStates.delete(userId);
        return null;
    }
    return state;
};

function formatMessage(text, mentions = []) {
    // Ganti semua placeholder mention dengan format yang benar
    mentions.forEach(jid => {
        const mentionFormat = `@${jid.replace(/@.+/, '')}`;
        // Ganti semua instance dari nomor tersebut dengan format mention
        text = text.replace(new RegExp(jid.replace(/@.+/, ''), 'g'), mentionFormat.slice(1));
    });
    return text;
}
async function sendMessageWithMentions(nvdia, msg, text, additionalMentions = []) {
    if (msg.key && msg.key.remoteJid) {
        // Gabungkan mentions dari sender dan mentions tambahan
        const mentionedJid = [
            msg.sender || msg.key.participant || msg.key.remoteJid,
            ...additionalMentions
        ].filter(Boolean); // Filter out any undefined values

        // Format ulang pesan dengan mentions
        const formattedText = formatMessage(text, mentionedJid);

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: formattedText,
            mentions: mentionedJid
        }, {
            quoted: msg
        });
    }
}

module.exports.handleIncomingMessage = async (nvdia, msg, m) => {
    try {
       const fatkuns = m && (m.quoted || m);
       const quoted = (fatkuns?.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] :
       (fatkuns?.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] :
       (fatkuns?.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] :
       m.quoted || m;
       const mime = ((quoted?.msg || quoted) || {}).mimetype || '';
       const qmsg = (quoted?.msg || quoted);
       const timezone = 'Asia/Jakarta';
       const jam = moment().tz(timezone).format('dddd DD-MM-YYYY HH:mm:ss');
       const sender = msg.key.remoteJid;
       const isGroup = sender.endsWith('@g.us');
       const budy = (m && typeof m.text === 'string') ? m.text : '';
       const pushname = msg.pushName || 'User';
       const senderNumber = m.sender ? m.sender.replace(/[^0-9]/g, '') : '';
       const botNumber = await nvdia.decodeJid(nvdia.user.id);
       const isCreator = (() => {
            // Pastikan global.owner ada dan valid
            if (!global.owner) return false;
            // Bersihkan format nomor owner
            const ownerNumber = global.owner.replace(/[^0-9]/g, '');
            // Log untuk debugging
            console.log('Sender:', senderNumber);
            console.log('Owner:', ownerNumber);
            // Cek apakah nomor pengirim sama dengan nomor owner
            return senderNumber === ownerNumber;
        })();
       const itsMe = (m && m.sender && m.sender == botNumber) || false;
       const packnames = `Sticker`;
       const authors = `Dibuat pada\n${jam}\nCredit : Alya-San`;
       const more = String.fromCharCode(8206);
       const readmore = more.repeat(4001);

       // Ekstrak message type dan content
        const messageType = Object.keys(msg.message || {})[0];
        let messageContent = '';
        
        // Cek apakah pesan me-reply bot
        const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant === global.nomorbot;
        
        // Cek apakah ada mention ke bot
        const hasMention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(global.nomorbot);

        // Ekstrak konten pesan berdasarkan tipe
        if (messageType === 'conversation') {
            messageContent = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            messageContent = msg.message.extendedTextMessage.text;
        } else if (['imageMessage', 'videoMessage', 'documentMessage'].includes(messageType)) {
            messageContent = msg.message[messageType].caption || '';
       }

// Console message
    console.log(
    chalk.green(`[${new Date().toLocaleTimeString()}]`) + 
    chalk.blue(` Group: `) + chalk.bold(msg.key.remoteJid.includes('@g.us') ? msg.key.remoteJid : 'Private Chat') +
    chalk.blue(` Pesan diterima dari `) + 
    chalk.bold(msg.key.participant || sender) +
    chalk.white(` | From Bot: ${msg.key.fromMe ? 'YES' : 'NO'}`) + 
    chalk.yellow(` "${messageContent}"`) + 
    chalk.magenta(` (Type: ${messageType})`) +
    chalk.cyan(` [Reply: ${isReplyToBot}, Mention: ${hasMention}]`)
);

// Multi-prefix
        const prefixes = ['!', '.'];
        const prefixUsed = prefixes.find(p => messageContent.startsWith(p)) || '';
        const command = messageContent.slice(prefixUsed.length).split(' ')[0].toLowerCase();
        const args = messageContent
    .slice((prefixUsed + command).length)
    .trim()
    .split(/\s+/);
        // Cek tag dan reply
        const isTagged = isTaggingBot(messageContent, global.nomorbot);
        const isReplied = msg.message?.extendedTextMessage?.contextInfo?.participant === global.nomorbot;

    function pickRandom(list) {
        return list[Math.floor(list.length * Math.random())]
    }
    
    // Handle tag/reply ke bot
        if (hasMention || isReplyToBot) {
    if (isGroup && !prefixUsed && (!aiGroupStatus.has(msg.key.remoteJid) || aiGroupStatus.get(msg.key.remoteJid) !== false)) {
        if (msg.key.fromMe) return;
        console.log('Bot sedang ditag atau direply!!');
        await handleAlya(nvdia, msg, messageContent, true);
        return;
    }
}

        // Handle command alya/ai
        if (['alya'].includes(command)) {
    if (isGroup) {
        console.log('Command alya terdeteksi...');
        await handleAlya(nvdia, msg, args.join(' '));
    } else {
        await nvdia.sendMessage(sender, { text: 'AI commands only work in groups' });
    }
    return;
}

        // Handle private chat tanpa prefix
        if (!isGroup && !prefixUsed) {
            console.log('Private chat terdeteksi...');
            await handleAIPrivate(nvdia, msg, messageContent);
            return;
        }

    switch (command) {
case 'tikel':
case 'stiker':
case 'sticker':
case 's': {
    try {
        if (!quoted && !(msg.message?.imageMessage || msg.message?.videoMessage)) {
            return nvdia.sendMessage(sender, { 
                text: `Kirim/Reply Gambar/Video/Gif Dengan Caption ${prefixUsed + command}`,
                quoted: msg 
            });
        }

        let mediaData;
        if (quoted) {
            if (!/image|video/g.test(mime)) {
                return nvdia.sendMessage(sender, { 
                    text: 'Media yang di-reply harus berupa gambar/video/gif!',
                    quoted: msg 
                });
            }

            if (/video/g.test(mime)) {
                if ((quoted.msg || quoted).seconds > 10) {
                    return nvdia.sendMessage(sender, {
                        text: 'Maksimal durasi video 10 detik!',
                        quoted: msg
                    });
                }
            }
            
            mediaData = await quoted.download();
        } 

        else {
            if (msg.message.imageMessage) {
                media = await downloadMediaMessage(msg, 'buffer', {});
            } else if (msg.message.videoMessage) {
                if (msg.message.videoMessage.seconds > 10) {
                    return nvdia.sendMessage(sender, {
                        text: 'Maksimal durasi video 10 detik!',
                        quoted: msg
                    });
                }
                mediaData = await downloadMediaMessage(msg, 'buffer', {});
            }
        }

        let packname = args.length > 1 ? args.join(' ') : packnames;
        let author = authors;
        
        const stickerMetadata = {
            type: 'full',
            pack: packname,
            author: author,
            quality: 100 // You can adjust quality (1-100)
        };

        if (/image/.test(mime)) {
            let sticker = await new Sticker(mediaData, stickerMetadata)
            .toBuffer();
        await nvdia.sendFile(m.chat, sticker, 'sticker.webp', '', m);    
        } else if (/video/.test(mime)) {
            let sticker = await nvdia.sendVideoAsSticker(m.chat, mediaData, m, stickerMetadata);
            await fs.unlinkSync(sticker);
        }

    } catch (error) {
        console.error('Error in sticker creation:', error);
        await reply(nvdia, msg, 'Gagal membuat sticker! Pastikan media yang dikirim valid.');
    }
}
break;
case 'smeme': {
    let respond = `Balas Gambar Dengan Caption ${prefixUsed + command} teks bawah|teks atas`;
    if (!quoted) return nvdia.sendMessage(sender, { text: respond }, { quoted: msg });
    if (!/image/.test(mime)) return nvdia.sendMessage(sender, { text: respond }, { quoted: msg });
    if (!args.join(' ')) return nvdia.sendMessage(sender, { text: respond }, { quoted: msg });

    await reply(nvdia, msg, 'Sedang membuat stiker...');
    const atas = args.join(' ').split('|')[1] ? args.join(' ').split('|')[1] : '-';
    const bawah = args.join(' ').split('|')[0] ? args.join(' ').split('|')[0] : '-';

    try {
        let dwnld = await quoted.download();
        let fatGans = await catbox(dwnld);
        let smeme = `https://api.memegen.link/images/custom/${encodeURIComponent(bawah)}/${encodeURIComponent(atas)}.png?background=${fatGans}`;

        let stiker = await nvdia.sendImageAsSticker(sender, smeme, m, {
            packname: packnames,
            author: authors,
            quality: 50
        });
        await fs.unlinkSync(stiker);
    } catch (error) {
        console.error('Smeme error:', error);
        await reply(nvdia, msg, 'Gagal membuat stiker meme');
    }
}
break;
case 'qc': {
    let text, orang;
    
    // Handle quoted message case
    if (m.quoted) {
        const quotedMsg = m.quoted;
        text = quotedMsg.text || '';
        if (!text) {
            return nvdia.sendMessage(sender, { 
                text: 'Pesan yang di-reply harus mengandung text!' 
            }, { quoted: msg });
        }
        orang = quotedMsg.sender || quotedMsg.participant || msg.quoted.key.participant;
    } 
    // Handle direct message case
    else {
        if (!args[0]) {
            return nvdia.sendMessage(sender, { 
                text: 'Mana teksnya?',
                quoted: msg 
            });
        }
        text = args.join(' ');
        orang = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || msg.sender;
    }

    // Color mapping
    const colorMap = {
        '--merah': '#FF0000',
        '--biru': '#0000FF',
        '--hijau': '#00FF00',
        '--kuning': '#FFFF00',
        '--pink': '#FFC0CB',
        '--ungu': '#800080',
        '--orange': '#FFA500',
        '--coklat': '#A52A2A',
        '--abu': '#808080',
        '--putih': '#FFFFFF'
    };

    // Check for color flags
    let backgroundColor = '#2E4053';
    for (const [flag, color] of Object.entries(colorMap)) {
        if (text.includes(flag)) {
            backgroundColor = color;
            text = text.replace(flag, '').trim();
            break;
        }
    }

    // Get avatar and name
    const avatar = await nvdia.profilePictureUrl(orang).catch(_ => 'https://i.ibb.co/2WzLyGk/profile.jpg');
    const number = await nvdia.getName(orang);

    // Prepare quote JSON
    const json = {
        "type": "quote",
        "format": "png",
        "backgroundColor": backgroundColor,
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
            "entities": [],
            "avatar": true,
            "from": {
                "id": 1,
                "name": number,
                "photo": {
                    "url": avatar
                }
            },
            "text": text,
            "replyMessage": {}
        }]
    };

    // Create sticker function
    async function createSticker(req, url, quality) {
        let stickerMetadata = {
            type: 'full',
            pack: packnames,
            author: authors,
            quality
        }
        return (new Sticker(req ? req : url, stickerMetadata)).toBuffer()
    }

    // Process and send sticker
    await reply(nvdia, msg, 'Membuat sticker...');
    const res = await quoteApi(json)
    const buffer = Buffer.from(res.image, 'base64')
    let stiker = await createSticker(buffer, false)
    nvdia.sendFile(m.chat, stiker, 'sticker.webp', '', m)
}
break;
case 'alyaon':
    if (isCreator) {
        aiGroupStatus.set(msg.key.remoteJid, true);
        await reply(nvdia, msg, 'Alya siap menjawab pertanyaan');
    } else {
        await reply(nvdia, msg, 'Only bot owner can use this command.');
    }
    break;

case 'alyaoff':
    if (isCreator) {
        aiGroupStatus.set(msg.key.remoteJid, false);
        clearGroupConversation(msg.key.remoteJid);
        await reply(nvdia, msg, 'Ok, Alya akan beristirahat.');
    } else {
        await reply(nvdia, msg, 'Only bot owner can use this command.');
    }
break;
          case 'menu':
          let menuk = `Halo👋 ${pushname}\n> Berikut adalah fitur yang Alya miliki
`+ readmore + `
*AI Menu*
 • alya
 • ai
 • blackbox | bb

*Anime Menu*
 • anilist <query>
 • anilistinfo
 • anilisttop
 • waifu

*Download Menu*
 • amdl <link>
 • fesnuk | fb <link>
 • instagram | ig <link>
 • pindl <link>
 • tiktok | tt <link>

*Info Menu*
 • neofetch
 • ping

*Search Menu*
 • amsearch <query>
 • igreels | reels <query>
 • pinterest | pin <query>
 • play <link/query>
 • spotify <link/query>

*Sticker Menu*
 • brat <text>
 • qc
 • smeme
 • stiker | s | tikel
 • toimg | togif

*Tools Menu*
 • bratvideo <text>
 • colorize
 • enhance
 • hdvid
 • removebg
 • restore
 • tagsw
 • upscale`
           await nvdia.sendMessage(msg.key.remoteJid, {
                text: menuk,
                  ptt: true,
                    contextInfo: {
                    externalAdReply: {
                    showAdAttribution: true,
                        title: 'Alya -',
                        body: `${jam}`,
                        thumbnail: await fs.readFileSync('./lib/image/AlyaThumb.png'),
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });
            break;

        case 'ping':
            const startTime = Date.now();
            await reply(nvdia, msg, 'Memeriksa status...');
            const uptime = os.uptime();
            const systemInfo = await systeminformation.getStaticData();
            const cpuInfo = systemInfo.cpu;
            const memoryInfo = systemInfo.mem;

            const pingMessage = `Waktu ping: ${Date.now() - startTime}ms
Uptime: ${formatUptime(uptime)}
OS: ${os.platform()} ${os.release()}
CPU: ${cpuInfo.manufacturer} ${cpuInfo.brand} - ${cpuInfo.speed}GHz
            `;
            await nvdia.sendMessage(msg.key.remoteJid, { 
            text: pingMessage,
             contextInfo: {
               externalAdReply: {
                    showAdAttribution: true,
                        title: 'Pong! 🏓',
                        body: `${jam}`,
                        thumbnailUrl: pickRandom(ftreply),
                        mediaType: 1
                                  }
                              }
                  }, { quoted: msg });
            break;
            
                  // Command untuk fitur neofetch;
        case 'neofetch':
    exec('neofetch --stdout', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            reply(nvdia, msg, `Error executing neofetch: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            reply(nvdia, msg, `Error: ${stderr}`);
            return;
        }
        nvdia.sendMessage(msg.key.remoteJid, { 
            text: `${stdout}`,
            contextInfo: {
               externalAdReply: {
                    showAdAttribution: true,
                        title: 'Neofetch',
                        body: `${jam}`,
                        thumbnailUrl: pickRandom(ftreply),
                        mediaType: 1
                                  }
                              }
                  }, { quoted: msg });
    });
    break;
case 'bratvideo': {
    const text = args.join(' ');
    if (!text) return reply(nvdia, msg, `Contoh: ${prefixUsed + command} hai`);
    if (text.length > 250) return reply(nvdia, msg, `Karakter terbatas, max 250!`);
    const words = text.split(" ");
    const tempDir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const framePaths = [];
    try {
        for (let i = 0; i < words.length; i++) {
            const currentText = words.slice(0, i + 1).join(" ");
            const res = await axios.get(
                `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(currentText)}`,
                { responseType: "arraybuffer" }
            );
            const framePath = path.join(tempDir, `frame${i}.mp4`);
            fs.writeFileSync(framePath, res.data);
            framePaths.push(framePath);
        }
    const fileListPath = path.join(tempDir, "filelist.txt");
        let fileListContent = "";
        for (let i = 0; i < framePaths.length; i++) {
            fileListContent += `file '${framePaths[i]}'\n`;
            fileListContent += `duration 0.7\n`;
        }
        fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`;
        fileListContent += `duration 2\n`;
    fs.writeFileSync(fileListPath, fileListContent);
        const outputVideoPath = path.join(tempDir, "output.mp4");
        execSync(
            `ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset ultrafast -pix_fmt yuv420p ${outputVideoPath}`
        );
        await nvdia.sendMessage(msg.key.remoteJid, {
            video: { url: outputVideoPath },
            caption: 'Brat Video Result',
            contextInfo: {
                externalAdReply: {
                showAdAttribution: true,
                    title: 'Brat Video',
                    body: `${jam}`,
                    thumbnailUrl: pickRandom(ftreply),
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: msg });
     framePaths.forEach((frame) => {
            if (fs.existsSync(frame)) fs.unlinkSync(frame);
        });
        if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath);
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
    } catch (error) {
        console.error('Brat Video Error:', error);
        reply(nvdia, msg, 'Terjadi kesalahan');
    }
}
break;
case 'brat': {
    let text;

    if (args.length >= 1) {
        text = args.slice(0).join(" ");
    } else if (m.quoted && m.quoted.text) {
        text = m.quoted.text;
    } else {
        await nvdia.sendMessage(sender, { text: "Input teks atau reply teks yang ingin dijadikan brat!"}, { quoted: msg });
        return;
    }

    if (!text) {
        return nvdia.sendMessage(sender, { text:`Penggunaan: ${prefixUsed + command} <teks>`}, { quoted: msg });
    }

    let ngawiStik = await getBuffer(`https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`);
    await nvdia.sendImageAsSticker(m.chat, ngawiStik, m, {
        packname: packnames,
        author: authors
    });
}
break;            

case 'play': {
    if (!args[0]) { // Check if first argument exists
        await nvdia.sendMessage(sender, { 
            text: `Masukan judul/link!\ncontoh:\n\n${prefixUsed + command} Kingslayer\n${prefixUsed + command} https://youtube.com/watch?v=example`,
            quoted: msg 
        });
        return;
    }

    try {
        const searchQuery = args.join(' ');
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-_]+/;
        let videoInfo;

        // Send initial loading message
        const loadingMsg = await nvdia.sendMessage(sender, { 
            text: '⌛ Mencari...'
        }, { quoted: msg });

        if (ytRegex.test(searchQuery)) {
            // Direct URL provided
            const videoUrl = searchQuery;
            const mp4Response = await axios.get(`https://fastrestapis.fasturl.cloud/downup/ytmp4?url=${videoUrl}&quality=720`);
            const mp3Response = await axios.get(`https://fastrestapis.fasturl.cloud/downup/ytmp3?url=${videoUrl}&quality=256kbps`);
            
            if (!mp4Response.data.status === 200 || !mp3Response.data.status === 200) {
                throw new Error('Gagal mendapatkan informasi video');
            }
            
            videoInfo = {
                title: mp4Response.data.result.title,
                thumbnail: mp4Response.data.result.metadata.thumbnail,
                duration: mp4Response.data.result.metadata.duration,
                views: mp4Response.data.result.metadata.views,
                author: mp4Response.data.result.author.name,
                mp4: mp4Response.data.result.media,
                mp3: mp3Response.data.result.media,
                quality: {
                    video: mp4Response.data.result.quality,
                    audio: mp3Response.data.result.quality
                }
            };
        } else {
            // Search query provided
            const searchResponse = await axios.get(`https://vapis.my.id/api/yts?q=${encodeURIComponent(searchQuery)}`);
            if (!searchResponse.data.status || !searchResponse.data.data || searchResponse.data.data.length === 0) {
                throw new Error('Video tidak ditemukan');
            }
            
            const firstVideo = searchResponse.data.data[0];
            
            // Get video and audio info using the found video URL
            const mp4Response = await axios.get(`https://fastrestapis.fasturl.cloud/downup/ytmp4?url=${firstVideo.url}&quality=720`);
            const mp3Response = await axios.get(`https://fastrestapis.fasturl.cloud/downup/ytmp3?url=${firstVideo.url}&quality=256kbps`);
            
            if (!mp4Response.data.status === 200 || !mp3Response.data.status === 200) {
                throw new Error('Gagal mendapatkan informasi video');
            }

            videoInfo = {
                title: mp4Response.data.result.title,
                thumbnail: mp4Response.data.result.metadata.thumbnail,
                duration: mp4Response.data.result.metadata.duration,
                views: mp4Response.data.result.metadata.views,
                author: mp4Response.data.result.author.name,
                url: mp4Response.data.result.url,
                mp4: mp4Response.data.result.media,
                mp3: mp3Response.data.result.media,
                quality: {
                    video: mp4Response.data.result.quality,
                    audio: mp3Response.data.result.quality
                }
            };
        }

        await nvdia.sendMessage(msg.key.remoteJid, {
            text: Buffer.from('*Video Ditemukan!* ✨\n\n╔╾┅━┅━┅━┅━┅━┅━┅━┅⋄\n┇❏ `Judul:` ' + videoInfo.title + '\n┇❏ `Channel:` ' + videoInfo.author + '\n┇❏ `Durasi:` ' + videoInfo.duration + '\n┇❏ `Views:` ' + videoInfo.views + '\n┇❏ `Quality Video:` ' + videoInfo.quality.video + 'p\n┇❏ `Quality Audio:` ' + videoInfo.quality.audio + '\n╚╾┅━┅━┅━┅━┅━┅━┅━┅⋄\n\nSilahkan ketik:\n*.audio* - untuk download MP3\n*.video* - untuk download MP4').toString(),
            footer: 'Alya✨',
            ptt: false,
                    contextInfo: {
                    externalAdReply: {
                    showAdAttribution: true,
                    title: videoInfo.title,
                    body: videoInfo.author,
                    thumbnailUrl: videoInfo.thumbnail,
                    mediaType: 1,
                    previewType: 1,
                    renderLargerThumbnail: true,
                    mediaUrl: videoInfo.url,
                    sourceUrl: videoInfo.Url
                    }
                }
            }, { quoted: msg });

        // Store video info in state
        setState(sender, 'awaiting_format', {
            videoInfo
        });

    } catch (error) {
        console.error("Error pada fitur play:", error);
        
        let errorMsg = `Terjadi error: ${error.message}`;

        if (error.message === 'Video tidak ditemukan') {
            errorMsg = 'Video tidak ditemukan. Silakan coba kata kunci lain.';
        } else if (error.message === 'Gagal mendapatkan informasi video') {
            errorMsg = 'Gagal mendapatkan informasi video. Silakan coba lagi nanti.';
        } else if (error.response && error.response.status === 404) {
            errorMsg = 'API tidak dapat diakses. Silakan coba lagi nanti.';
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await reply(nvdia, msg, errorMsg);
    }
}
break;
case 'audio': case 'video': {
    const userState = getState(sender);
    if (!userState || userState.state !== 'awaiting_format') {
        return;
    }

    const { videoInfo } = userState.data;
    const isAudio = command === 'audio';

    try {
        // Send waiting message
        await nvdia.sendMessage(msg.key.remoteJid, { 
            text: `⌛ Mohon tunggu, sedang memproses ${isAudio ? 'audio' : 'video'}...` 
        }, { quoted: msg });

        if (isAudio) {
            // Send audio
            await nvdia.sendMessage(msg.key.remoteJid, {
                audio: { url: videoInfo.mp3 },
                mimetype: 'audio/mpeg',
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        title: videoInfo.title,
                        body: `Channel: ${videoInfo.author}`,
                        mediaType: 2,
                        thumbnailUrl: videoInfo.thumbnail,
                        renderLargerThumbnail: true,
                        mediaUrl: videoInfo.url,
                        sourceUrl: videoInfo.Url
                    }
                }
            }, { quoted: msg });
        } else {
            // Send video
            await nvdia.sendMessage(msg.key.remoteJid, {
                video: { url: videoInfo.mp4 },
                caption: `✨ *${videoInfo.title}*\nChannel: ${videoInfo.author}\n\n`,
                mimetype: 'video/mp4',
                fileName: `${videoInfo.title}.mp4`
            }, { quoted: msg });
        }

    } catch (error) {
        console.error(`Error processing ${isAudio ? 'audio' : 'video'}:, error`);
        await reply(nvdia, msg, `Gagal memproses ${isAudio ? 'audio' : 'video'}. Silakan coba lagi nanti.`);
    } finally {
        userStates.delete(sender);
    }
}
break;
case 'spotify': {
    if (!args.length) {
        nvdia.sendMessage(sender, { text: `Masukan judul/link!\ncontoh:\n\n${prefixUsed + command} 1番輝く星\n${prefixUsed + command} https://open.spotify.com/track/xxxxx`}, { quoted: msg });
        return;
    }

    try {
        const query = args.join(' ');
        const spotifyRegex = /^https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[\w\-]+/;

        if (spotifyRegex.test(query)) {
            // Kode existing untuk handling URL Spotify tetap sama
            // ...
        } else {
            try {
                console.log('Mencari dengan keyword:', query);
                const searchRes = await axios.get(`https://rest.cifumo.xyz/search/spotifys?q=${encodeURIComponent(query)}`);

                if (!searchRes.data || !searchRes.data.result || !searchRes.data.result.length) {
                    throw new Error('Lagu tidak ditemukan');
                }

                const tracks = searchRes.data.result.slice(0, 10);
                
                // Simpan hasil pencarian ke dalam Map dengan ID user sebagai key
                searchResults.set(sender, tracks);
                // Set state user ke 'awaiting_selection'
                setState(sender, 'awaiting_selection', { tracks });

                let message = `*Hasil Pencarian Spotify*\n\nKetik nomor untuk mendownload lagu atau ketik 'cancel' untuk membatalkan.\n\n`;
                tracks.forEach((track, index) => {
                    message += `*${index + 1}.* ${track.title}\n└ Durasi: ${track.duration} | Popularitas: ${track.popularity}\n\n`;
                });
                message += `\nSilakan kirim angka 1-${tracks.length} untuk mendownload lagu yang dipilih.`;

                await nvdia.sendMessage(msg.key.remoteJid, {
                    text: message,
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: true,
                            title: 'Spotify search',
                            body: `${jam}`,
                            thumbnailUrl: pickRandom(ftreply),
                            mediaType: 1
                        }
                    }
                }, { quoted: msg });
            } catch (error) {
                console.error('Error pencarian:', error);
                throw error;
            }
        }
    } catch (e) {
        console.error("Error pada fitur spotify:", e);
        await reply(nvdia, msg, `Terjadi kesalahan: ${e.message}`);
    }
}
break;

// Case baru untuk menangani respons angka
case '1': case '2': case '3': case '4': case '5':
case '6': case '7': case '8': case '9': case '10': {
    const userState = getState(sender);
    
    if (!userState || userState.state !== 'awaiting_selection') {
        return;
    }

    const selectedIndex = parseInt(command) - 1;
    const tracks = userState.data.tracks;

    if (selectedIndex < 0 || selectedIndex >= tracks.length) {
        await reply(nvdia, msg, 'Nomor tidak valid. Silakan pilih nomor yang benar.');
        return;
    }

    try {
        const selectedTrack = tracks[selectedIndex];
        
        // Kirim pesan loading
        await nvdia.sendMessage(sender, {
            text: `⌛ Sedang memproses audio...\n\n*Judul:* ${selectedTrack.title}\n*Artis:* ${selectedTrack.artist}`
        }, { quoted: msg });

        // Download lagu menggunakan URL Spotify
        const downloadRes = await axios.get(`https://rest.cifumo.xyz/download/spotifydl?url=${encodeURIComponent(selectedTrack.url)}`);
        
        if (!downloadRes.data || !downloadRes.data.result) {
            throw new Error('Format respons API tidak valid');
        }

        const songData = {
            title: downloadRes.data.result.title,
            artist: downloadRes.data.result.artis,
            thumbnail: downloadRes.data.result.image,
            url: downloadRes.data.result.download,
            duration: downloadRes.data.result.durasi,
            spotifyUrl: selectedTrack.url
        };

        // Kirim audio
        await nvdia.sendMessage(msg.key.remoteJid, {
            audio: { url: songData.url },
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: songData.title,
                    mediaType: 1,
                    previewType: 1,
                    body: songData.artist,
                    thumbnailUrl: songData.thumbnail,
                    renderLargerThumbnail: true,
                    mediaUrl: songData.spotifyUrl,
                    sourceUrl: songData.spotifyUrl
                }
            }
        }, { quoted: msg });

        // Hapus state setelah selesai
        userStates.delete(sender);

    } catch (error) {
        console.error('Error downloading:', error);
        await reply(nvdia, msg, `Gagal mengunduh lagu: ${error.message}`);
    }
}
break;

case 'cancel': {
    const userState = getState(sender);
    if (userState && userState.state === 'awaiting_selection') {
        userStates.delete(sender);
        await reply(nvdia, msg, 'Pencarian dibatalkan.');
    }
}
break;

case 'ai': case 'claude': {
        await handleAI(nvdia, msg, sender, args, prefixUsed, command);
}
break;
case 'blackbox': case 'bb': {
                    if(!args.length) { nvdia.sendMessage(sender, { text: 'Halo, Mau Bertanya Apa?'}, { quoted: msg });
                    return;
                    }
                    const query = args.join(' ');
                    let anu = `https://api.siputzx.my.id/api/ai/blackboxai?content=${encodeURIComponent(query)}`;
                    let res = await fetch(anu)
                    let response = await res.json(); 
                    let teks = `${response.data}`
                    try {
                        nvdia.sendMessage(sender, {text: teks}, {quoted: m});
                    } catch (error) {
                        console.log('Error pada aiBlackbox:', error);
                        await reply(nvdia, msg, `Maaf, terjadi kesalahan: ${error.message}`);
                    }
                }
break;
case 'ig': case 'instagram': {
    const url = args.length > 0 ? args[0] : '';
    await handleIgram(nvdia, msg, url);
}
break;

case 'tt': case 'tiktok': {
    const url = args.length > 0 ? args[0] : '';
    await handleTtsave(nvdia, msg, url);
}
break;
case 'next': {
        await handleNext(nvdia, msg, sender, 'pinterest', 'igreels');
    }
break;
    case 'stop': {
        await handleStop(nvdia, msg, sender, 'pinterest', 'igreels');
    }
break;
case 'pinterest': case 'pin': {
    if (!args.length) {
        await reply(nvdia, msg, `Masukan kata kunci!\ncontoh:\n\n${prefixUsed + command} Alya`);
        return;
    }

    try {
        // Send loading message
        const loadingMsg = await nvdia.sendMessage(sender, { 
            text: '⏳ Mencari gambar di Pinterest...'
        }, { quoted: msg });

        // Search Pinterest
        const query = args.join(' ');
        const { data } = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/`, {
            params: {
                source_url: `/search/pins/?q=${query}`,
                data: JSON.stringify({
                    options: {
                        isPrefetch: false,
                        query: query,
                        scope: "pins",
                        no_fetch_context_on_resource: false
                    },
                    context: {}
                })
            }
        });

        // Process results
        const results = data.resource_response.data.results.filter(v => v.images?.orig);
        if (!results.length) {
            await nvdia.sendMessage(sender, { 
                delete: loadingMsg.key 
            });
            await reply(nvdia, msg, 'Tidak ada gambar ditemukan. Silakan coba kata kunci lain.');
            return;
        }

        // Format results
        const images = results.map(result => ({
            url: result.images.orig.url,
            caption: `*[Pinterest Image]*\n\n` +
                    `> *Upload by:* ${result.pinner.username}\n` +
                    `> *Full Name:* ${result.pinner.full_name}\n` +
                    `> *Followers:* ${result.pinner.follower_count}\n` +
                    `> *Caption:* ${result.grid_title || '-'}\n` +
                    `> *Source:* https://id.pinterest.com/pin/${result.id}`
        }));

        // Save images to state
        StateManager.setState(sender, 'pinterest_search', {
            images: images,
            currentIndex: 0,
            query: query
        });

        // Send first image
        await nvdia.sendMessage(sender, {
            image: { url: images[0].url },
            caption: `${images[0].caption}\n\n*Hasil pencarian untuk:* "${query}"\n*Image:* 1/${images.length}\n\nKetik *.next* untuk gambar selanjutnya\nKetik *.stop* untuk mencari gambar lain`,
        }, { quoted: msg });

        // Delete loading message
        await nvdia.sendMessage(sender, { 
            delete: loadingMsg.key 
        });

    } catch (error) {
        console.error("Error pada fitur pinterest:", error);
        
        let errorMsg = 'Terjadi kesalahan saat mencari gambar.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMsg = 'Pinterest API tidak dapat diakses. Silakan coba lagi nanti.';
            } else {
                errorMsg = 'Gagal mengambil data dari Pinterest. Silakan coba lagi.';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await reply(nvdia, msg, errorMsg);
    }
}
break;

case 'pindl':
case 'pinterstdl': {
    if (!args[0]) return reply(nvdia, msg, 'Url mana.');
    await handlePin(nvdia, msg, args[0]);
}
break;
case 'fb':
case 'fesnuk':
case 'fbdl': {
    if (!args[0]) {
        await nvdia.sendMessage(sender, { 
            text: `Please provide a Facebook video URL\n\nExample: ${prefixUsed}fb https://www.facebook.com/watch?v=123456789` 
        }, { quoted: msg });
        return;
    }

    const url = args[0];
    // More lenient URL validation that accepts various Facebook URL formats
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
        await nvdia.sendMessage(sender, { 
            text: '❌ Invalid Facebook video URL. Please provide a valid Facebook video link.' 
        }, { quoted: msg });
        return;
    }

    await handleFacebookDownload(nvdia, msg, url);
}
break;
case 'igreels': case 'reels': {
    if (!args.length) {
        await reply(nvdia, msg, `Masukan kata kunci!\ncontoh:\n\n${prefixUsed + command} Alya`);
        return;
    }

    try {
        // Send loading message
        const loadingMsg = await nvdia.sendMessage(sender, { 
            text: '⏳ Mencari reels di Instagram...'
        }, { quoted: msg });

        // Search Instagram Reels
        const query = args.join(' ');
        const response = await axios.get(`https://api.vreden.my.id/api/instagram/reels?query=${encodeURIComponent(query)}`);

        if (!response.data.result.media || response.data.result.media.length === 0) {
            await nvdia.sendMessage(sender, { 
                delete: loadingMsg.key 
            });
            await reply(nvdia, msg, 'Tidak ada reels ditemukan. Silakan coba kata kunci lain.');
            return;
        }

        // Format results
        const reels = response.data.result.media.map(reel => ({
            url: reel.reels.url,
            thumbnail: reel.reels.thumbnail,
            caption: `*[Instagram Reels]*\n\n` +
                    `> *Upload by:* ${reel.profile.username}\n` +
                    `> *Full Name:* ${reel.profile.full_name}\n` +
                    `> *Duration:* ${reel.reels.duration}s\n` +
                    `> *Caption:* ${reel.caption.text}\n` +
                    `> *Stats:*\n` +
                    `> 👁 Views: ${reel.statistics.play_count}\n` +
                    `> ❤️ Likes: ${reel.statistics.like_count}\n` +
                    `> 💬 Comments: ${reel.statistics.comment_count}\n` +
                    `> 🔄 Shares: ${reel.statistics.share_count}\n\n` +
                    `> *Link:* ${reel.reels.video}`
        }));

        // Save reels to state
        StateManager.setState(sender, 'igreels_search', {
            reels: reels,
            currentIndex: 0,
            query: query,
            itemKey: 'reels'
        });

        // Send first video
        await nvdia.sendMessage(sender, {
            video: { url: reels[0].url },
            caption: `${reels[0].caption}\n\n*Hasil pencarian untuk:* "${query}"\n*Reels:* 1/${reels.length}\n\nKetik *.next* untuk reels selanjutnya\nKetik *.stop* untuk berhenti`,
            gifPlayback: false
        }, { quoted: msg });

        // Delete loading message
        await nvdia.sendMessage(sender, {
            delete: loadingMsg.key 
        });

    } catch (error) {
        console.error("Error pada fitur igreels:", error);
        
        let errorMsg = 'Terjadi kesalahan saat mencari reels.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMsg = 'Instagram API tidak dapat diakses. Silakan coba lagi nanti.';
            } else {
                errorMsg = 'Gagal mengambil data dari Instagram. Silakan coba lagi.';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await reply(nvdia, msg, errorMsg);
    }
}
break;

case 'tagsw': {
    if (!args.length && !quoted) return reply(nvdia, msg, `Masukkan teks untuk status atau reply gambar/video dengan caption`);

    try {
        let media = null;
        let options = {};
        const jids = [msg.key.participant || sender, msg.key.remoteJid];
        const captionPrefix = `Request by: ${pushname}\nReason: `; // Menambahkan nama requester

        if (quoted) {
            const mime = quoted.mtype || quoted.mediaType || '';
            if (mime.includes('image')) {
                media = await quoted.download();
                options = {
                    image: media,
                    caption: captionPrefix + (args.join(' ') || qmsg.text || ''),
                };
            } else if (mime.includes('video')) {
                media = await quoted.download();
                options = {
                    video: media,
                    caption: captionPrefix + (args.join(' ') || qmsg.text || ''),
                };
            } else {
                options = {
                    text: captionPrefix + (args.join(' ') || qmsg.text || ''),
                };
            }
        } else {
            options = {
                text: captionPrefix + args.join(' '),
            };
        }

        const groupMetadata = await nvdia.groupMetadata(msg.key.remoteJid);
        const participants = groupMetadata.participants.map(a => a.id);

        await nvdia.sendMessage("status@broadcast", 
            options,
            {
                backgroundColor: "#7ACAA7",
                textArgb: 0xffffffff,
                font: 1,
                statusJidList: participants,
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: jids.map((jid) => ({
                                    tag: "to",
                                    attrs: { jid: msg.key.remoteJid },
                                    content: undefined,
                                })),
                            },
                        ],
                    },
                ],
            }
        );

        await sendMessageWithMentions(nvdia, msg, `Status updated successfully by @${msg.sender.split('@')[0]}!`);

    } catch (error) {
        console.error('Error in tagsw:', error);
        await reply(nvdia, msg, `Failed to update status: ${error.message}`);
    }
}
break;
case 'getcontact2': {
    if (!isCreator) return reply(nvdia, msg, 'Only bot owner can use this command.');
    await handleGetContact(nvdia, msg, args.join(' '));
}
break;
case 'getcontact': {
    if (!args[0]) return reply(nvdia, msg, `Example: ${prefixUsed}getcontact 081234567890`);
    
    let phoneNumber = args[0];
    // Remove any non-numeric characters and ensure proper format
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Add country code if not present
    if (!phoneNumber.startsWith('62')) {
        phoneNumber = '62' + phoneNumber.replace(/^0+/, '');
    }
    
    try {
        const response = await axios.get(`https://fastrestapis.fasturl.cloud/tool/getcontact?number=${phoneNumber}`);
        const data = response.data;
        
        if (data.status === 200 && data.content === "Success") {
            const result = data.result;
            
            // Format all results
            let formattedResponse = `*GETCONTACT RESULTS*\n\n`;
            
            // User data
            formattedResponse += `*◈ USER DATA ◈*\n`;
            formattedResponse += `Name: ${result.userData.name}\n`;
            formattedResponse += `Phone: ${result.userData.phone}\n`;
            formattedResponse += `Provider: ${result.userData.provider}\n\n`;
            
            // Tags/Names
            formattedResponse += `*◈ TAGS/NAMES FOUND ◈*\n`;
            if (result.tags && result.tags.length > 0) {
                result.tags.forEach((tag, index) => {
                    formattedResponse += `${index + 1}. ${tag}\n`;
                });
            } else {
                formattedResponse += `No tags found\n`;
            }
            
            formattedResponse += `\n*Total Names:* ${result.tags.length}\n`;
            formattedResponse += `\n_Data provided by - ${data.creator}_`;
            
            await nvdia.sendMessage(msg.key.remoteJid, {
                text: formattedResponse,
                quoted: msg
            });
        } else {
            await reply(nvdia, msg, 'Failed to fetch contact information. Please try again later.');
        }
    } catch (error) {
        console.error('Error in getcontact:', error);
        await reply(nvdia, msg, `Error: ${error.message}\nPlease check the number and try again.`);
    }
}
break;
case 'servermc': case 'mc': {
    if (!args.length) {
        await nvdia.sendMessage(sender, { 
            text: `Masukan Nama Ip Server Nya\nContoh\n${prefixUsed}servermc <ip> java\n${prefixUsed}servermc <ip> bedrock` 
        }, { quoted: msg });
        return;
    }

    try {
        if (args[1]?.toLowerCase() === 'java') {
            const response = await axios.get('https://api.mcsrvstat.us/3/' + args[0]);
            const jav = response.data;

            // Check if server is offline or data is invalid
            if (!jav || jav.online === false) {
                await reply(nvdia, msg, "Server sedang offline atau tidak ditemukan");
                return;
            }

            let capt = `⏤͟͟͞͞╳── *[ sᴇʀᴠᴇʀᴍᴄ - ᴊᴀᴠᴀ ]* ── .々─ᯤ\n`;
            capt += `│    =〆 ɪᴘ: ${jav.hostname || args[0]}\n`;
            capt += `│    =〆 ᴘᴏʀᴛ: ${jav.port || '25565'}\n`;
            capt += `│    =〆 ᴠᴇʀsɪ: ${jav.version || 'N/A'}\n`;
            capt += `│    =〆 ᴏɴʟɪɴᴇ: ${jav.online ? 'Yes' : 'No'}\n`;
            capt += `│    =〆 ᴘʟᴀʏᴇʀ: ${jav.players?.online || 0} \\ ${jav.players?.max || 0}\n`;
            capt += `⏤͟͟͞͞╳────────── .✦`;

            await reply(nvdia, msg, capt);

        } else if (args[1]?.toLowerCase() === 'bedrock') {
            const response = await axios.get('https://api.mcsrvstat.us/bedrock/3/' + args[0]);
            const bed = response.data;

            // Check if server is offline or data is invalid
            if (!bed || bed.online === false) {
                await reply(nvdia, msg, "Server sedang offline atau tidak ditemukan");
                return;
            }

            let capt = `⏤͟͟͞͞╳── *[ sᴇʀᴠᴇʀᴍᴄ - ʙᴇᴅʀᴏᴄᴋ ]* ── .々─ᯤ\n`;
            capt += `│    =〆 ɪᴘ: ${bed.hostname || args[0]}\n`;
            capt += `│    =〆 ᴘᴏʀᴛ: ${bed.port || '19132'}\n`;
            capt += `│    =〆 ᴠᴇʀsɪ: ${bed.version || 'N/A'}\n`;
            capt += `│    =〆 ᴏɴʟɪɴᴇ: ${bed.online ? 'Yes' : 'No'}\n`;
            capt += `│    =〆 ᴘʟᴀʏᴇʀ: ${bed.players?.online || 0} \\ ${bed.players?.max || 0}\n`;
            capt += `⏤͟͟͞͞╳────────── .✦`;

            await reply(nvdia, msg, capt);
        } else {
            await nvdia.sendMessage(sender, { 
                text: `Masukan Nama Ip Server Nya\nContoh\n${prefixUsed}servermc <ip> java\n${prefixUsed}servermc <ip> bedrock` 
            }, { quoted: msg });
        }
    } catch (error) {
        console.error('Error in servermc:', error);
        await reply(nvdia, msg, `Terjadi kesalahan saat mengecek server: ${error.message}`);
    }
}
break;
case 'toimg': {
    try {
        // Periksa apakah ada pesan yang di-reply
        if (!m.quoted) {
            await reply(nvdia, msg, 'Reply stiker yang ingin diubah menjadi gambar');
            return;
        }

        // Periksa mime type dari pesan yang di-quoted
        const mime = (m.quoted.msg || m.quoted).mimetype || '';
        
        // Periksa apakah mime type adalah stiker
        if (!mime.includes('webp')) {
            await reply(nvdia, msg, 'Pesan yang di-reply harus berupa stiker');
            return;
        }

        // Download media
        const buffer = await m.quoted.download();

        // Kirim hasil konversi
        await nvdia.sendMessage(sender, {
            image: buffer,
            caption: 'Nih hasil convert stikernya'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in toimg:', error);
        await reply(nvdia, msg, `Terjadi kesalahan saat mengkonversi stiker: ${error.message}`);
    }
}
break;
case 'togif': {
    try {
        // Periksa apakah ada pesan yang di-reply
        if (!m.quoted) {
            await reply(nvdia, msg, 'Reply stiker yang ingin diubah menjadi video gif');
            return;
        }

        // Periksa mime type dari pesan yang di-quoted
        const mime = (m.quoted.msg || m.quoted).mimetype || '';
        
        // Periksa apakah mime type adalah stiker
        if (!mime.includes('webp')) {
            await reply(nvdia, msg, 'Pesan yang di-reply harus berupa stiker');
            return;
        }

        // Download sticker
        const media = await m.quoted.download();

        const url = await require('./App/tovideo').convert(media);

        // Send as video
        await nvdia.sendMessage(sender, {
            video: { url: url },
            caption: 'Ini dia'
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in tovideo:', error);
        await reply(nvdia, msg, `Terjadi kesalahan saat mengkonversi ke video: ${error.message}`);
    }
}
break;
case 'gitpush': {
    if (!isCreator) return reply(nvdia, msg, 'Only bot owner can use this command.');
    
    // Check if file path is provided
    if (!args[0]) return reply(nvdia, msg, `Example: ${prefixUsed}uploadgithub folder/custom-filename.jpg`);
    
    try {
        const githubToken = global.githubtoken;
        const owner = 'rizurinn'; // Your GitHub username
        const repo = 'anu'; // Repository name
        const branch = 'main';
        
        // Get quoted message
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        // Check if media exists
        if (!mime) return reply(nvdia, msg, 'Please reply to a media message (image/video/file)');
        
        // Send reaction
        await nvdia.sendMessage(msg.key.remoteJid, { 
            react: { 
                text: "⏱️", 
                key: msg.key 
            } 
        });
        
        // Download media
        const media = await quoted.download();
        
        // Use custom file path from args
        const customPath = args[0];
        // Ensure the path starts without a slash
        const filePath = customPath.startsWith('/') ? customPath.slice(1) : customPath;
        
        // Convert media content to base64
        const base64Content = Buffer.from(media).toString('base64');
        
        // Upload file to GitHub
        const response = await axios.put(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
                message: `Upload file ${filePath}`,
                content: base64Content,
                branch: branch,
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        
        // Generate raw URL for uploaded file
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `✅ File berhasil diupload ke GitHub!\n\n> Path: ${filePath}\n> Raw URL: ${rawUrl}`,
            quoted: msg
        });
        
    } catch (error) {
        console.error('Error in uploadgithub:', error);
        if (error.response) {
            const status = error.response.status;
            if (status === 404) {
                return reply(nvdia, msg, 'Error: Repository tidak ditemukan atau token tidak valid');
            } else if (status === 409) {
                return reply(nvdia, msg, 'Error: File dengan nama tersebut sudah ada di repository');
            }
        }
        await reply(nvdia, msg, `Error: ${error.message}`);
    }
}
break;
case 'getdata': {
  const axioss = require('axios');
  const cloudscraperr = require('cloudscraper');
  const fetchh = require('node-fetch');
  const { fetch: undiciFetch } = require('undici');
    let gtd = `
Usage: ${prefixUsed}getdata [options]
`+ readmore + `
Options:
  --url <url>             Specify the URL to fetch.
  --axios                 Use axios for the HTTP request.
  --fetch                 Use fetch for the HTTP request.
  --cloudscraper         Use cloudscraper for the HTTP request.
  --undici               Use undici for the HTTP request.
  --headers <json>        Set custom headers as a JSON object.
  --timeout <milliseconds> Set a timeout for the request (default: 0).
  --cookie <cookie>       Set the Cookie header.
  --only-headers         Only return the headers of the response.
  --get-buffer           Only return the response body as a buffer.

Example:
  ${prefixUsed}getdata https://example.com --fetch
  ${prefixUsed}getdata --url https://example.com --headers '{"User-Agent": "MyApp"}' --timeout 5000 --cookie "sessionid=abc123"
        `
    if (!args.length) {
        await nvdia.sendMessage(sender, { text: gtd}, { quoted: msg });
        return;
    }

    try {
        function parseArgs(args) {
            const options = {
                axios: false,
                fetch: false,
                cloudscraper: false,
                undici: false,
                headers: null,
                timeout: 0,
                cookie: '',
                onlyHeaders: false,
                getBufferOnly: false,
                authorization: null,
                url: null,
            };

            // Jika argumen pertama bukan flag, anggap sebagai URL
            if (args[0] && !args[0].startsWith('--')) {
                options.url = args[0];
                args = args.slice(1); // Hapus URL dari array args
            }

            for (let i = 0; i < args.length; i++) {
                switch (args[i]) {
                    case '--headers':
                        if (i + 1 < args.length) {
                            options.headers = JSON.parse(args[i + 1]);
                            i++;
                        }
                        break;
                    case '--axios':
                        options.axios = true;
                        break;
                    case '--fetch':
                        options.fetch = true;
                        break;
                    case '--cloudscraper':
                        options.cloudscraper = true;
                        break;
                    case '--undici':
                        options.undici = true;
                        break;
                    case '--authorization':
                        if (i + 1 < args.length) {
                            options.authorization = args[i + 1];
                            i++;
                        }
                        break;
                    case '--timeout':
                        if (i + 1 < args.length) {
                            options.timeout = parseInt(args[i + 1]);
                            i++;
                        }
                        break;
                    case '--cookie':
                        if (i + 1 < args.length) {
                            options.cookie = args[i + 1];
                            i++;
                        }
                        break;
                    case '--only-headers':
                        options.onlyHeaders = true;
                        break;
                    case '--get-buffer':
                        options.getBufferOnly = true;
                        break;
                    case '--url':
                        if (i + 1 < args.length) {
                            options.url = args[i + 1];
                            i++;
                        }
                        break;
                }
            }

            if (!options.url) {
                reply(nvdia, msg, 'URL tidak diisi.');
                return null;
            }

            // Jika tidak ada method yang dipilih, gunakan fetch sebagai default
            if (!options.axios && !options.fetch && !options.cloudscraper && !options.undici) {
                options.fetch = true;
            }

            return options;
        }

        async function Fetcher(url, options = {}) {
            const {
                axios,
                fetch,
                cloudscraper,
                undici,
                headers = {},
                timeout = 0,
                cookie = '',
                onlyHeaders = false,
                getBufferOnly = false,
            } = options;

            if (timeout < 0) {
                return reply(nvdia, msg, 'Timeout tidak boleh negatif.');
            }

            if (getBufferOnly && onlyHeaders) {
                return reply(nvdia, msg, 'Hanya satu dari --get-buffer dan --only-headers yang bisa digunakan.');
            }

            const finalHeaders = { ...headers };

            if (cookie) {
                finalHeaders['Cookie'] = cookie;
            }

            if (options.authorization) {
                finalHeaders['Authorization'] = options.authorization;
            }

            let response;

            try {
                if (axios) {
                    response = await axioss.get(url, { headers: finalHeaders, timeout });
                    return onlyHeaders ? response.headers : response.data;
                } else if (fetch) {
                    response = await fetchh(url, { 
                        headers: finalHeaders,
                        timeout: timeout || undefined
                    });
                    
                    if (onlyHeaders) {
                        const headers = {};
                        for (const [key, value] of response.headers.entries()) {
                            headers[key] = value;
                        }
                        return headers;
                    }
                    
                    if (getBufferOnly) {
                        return await response.buffer();
                    }
                    
                    const text = await response.text();
                    try {
                        return JSON.parse(text);
                    } catch {
                        return text;
                    }
                } else if (cloudscraper) {
                    response = await cloudscraperr.get(url, { 
                        headers: finalHeaders,
                        timeout
                    });
                    return response;
                } else if (undici) {
                    response = await undiciFetch(url, { 
                        headers: finalHeaders,
                        timeout: timeout || undefined
                    });
                    
                    if (onlyHeaders) {
                        return response.headers;
                    }
                    
                    return await response.text();
                }
            } catch (error) {
                throw new Error(`Fetch error: ${error.message}`);
            }
        }

        const options = parseArgs(args);
        if (!options) return;

        // Log untuk debugging
        console.log('Parsed options:', options);

        const result = await Fetcher(options.url, options);
        
        // Handle berbagai tipe response
        let responseText;
        if (Buffer.isBuffer(result)) {
            responseText = result.toString('utf-8');
        } else if (typeof result === 'object') {
            responseText = JSON.stringify(result, null, 2);
        } else {
            responseText = result;
        }

        await reply(nvdia, msg, responseText);

        // Save and send the file
        await fs.writeFileSync("./tes.html", responseText);

        await nvdia.sendMessage(
            sender,
            {
                document: fs.readFileSync("./tes.html"),
                fileName: "tes.html",
                mimetype: "text/html",
            },
            { quoted: msg }
        );

    } catch (error) {
        await reply(nvdia, msg, `Error: ${error.message}`);
    }
}
break;
case 'remini': case 'hd': {
    if (!quoted || !quoted.msg) {
        await reply(nvdia, msg, `Reply/Kirim photo yang mau di jernihkan`);
        return;
    }

    if (!/image/.test(mime)) {
        await reply(nvdia, msg, `Reply/Kirim photo yang mau di jernihkan`);
        return;
    }

    try {
        // Send loading message
        const loadingMsg = await nvdia.sendMessage(sender, { 
            text: '⏳ Sedang memproses gambar...'
        }, { quoted: msg });

        // Download the image
        let imageBuffer;
        if (quoted.msg) {
            imageBuffer = await downloadMediaMessage(quoted, 'buffer', {});
        }

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');

        // Send to remini API
        const response = await fetch("https://lexica.qewertyy.dev/upscale", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image_data: base64Image,
                format: "binary"
            })
        });

        if (!response.ok) {
            throw new Error('Failed to process image');
        }

        const resultBuffer = Buffer.from(await response.arrayBuffer());
        const fileSize = formatp(resultBuffer.length);

        // Send the processed image
        await nvdia.sendMessage(sender, {
            image: resultBuffer,
            caption: `*– 乂 Remini - Image*\n> *- Ukuran photo :* ${fileSize}`,
        }, { quoted: msg });

        // Delete loading message
        await nvdia.sendMessage(sender, { 
            delete: loadingMsg.key 
        });

    } catch (error) {
        console.error('Error in remini processing:', error);
        await reply(nvdia, msg, 'Maaf, terjadi kesalahan saat memproses gambar. Silakan coba lagi.');
    }
}
break;
case 'hdvid':
case 'reminivid': {
    if (!quoted) return nvdia.sendMessage(sender, { text: `Balas Video Dengan Caption ${prefixUsed}hdvid fps` }, { quoted: msg });
    if (!/video/.test(mime)) return nvdia.sendMessage(sender, { text: 'Kirim/balas video dengan caption *.hdvid* 60' }, { quoted: msg });
    
    const fps = parseInt(args[0]);
    if (!fps) return nvdia.sendMessage(sender, { text: 'Masukkan fps, contoh: *.hdvid* 60' }, { quoted: msg });
    if (fps > 30) return nvdia.sendMessage(sender, { text: 'Maksimal fps adalah 30 fps!' }, { quoted: msg });
    if ((quoted.msg || quoted).seconds > 30) return nvdia.sendMessage(sender, { text: 'Maksimal video 30 detik!' }, { quoted: msg });

    await nvdia.sendMessage(sender, { text: 'Wait... Executing the [ffmpeg] and [remini] libraries, This process may take 5-15 minutes' }, { quoted: msg });

    const chdir = "hd_video";
    const timestamp = Date.now();
    const pndir = `${chdir}/${m.sender}`;
    const rsdir = `${chdir}/result-${m.sender}`;
    const fdir = `${pndir}/frames/${timestamp}`;
    const rfdir = `${rsdir}/frames/${timestamp}`;
    const rname = `${rsdir}/${m.sender}-${timestamp}.mp4`;
    const tempFile = `${pndir}/temp-${timestamp}.json`;

    // Create directories if they don't exist
    const dirs = [chdir, pndir, rsdir, `${pndir}/frames`, fdir, `${rsdir}/frames`, rfdir];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    try {
        // Download and save media
        const media = await quoted.download();
        fs.writeFileSync(`${pndir}/${timestamp}`, media);

        // Get video information
        await new Promise((resolve, reject) => {
            exec(`ffprobe -v quiet -print_format json -show_format -show_streams ${pndir}/${timestamp}`, (error, stdout) => {
                if (error) reject(error);
                else {
                    fs.writeFileSync(tempFile, stdout);
                    resolve();
                }
            });
        });

        // Read video info
        const videoInfo = JSON.parse(fs.readFileSync(tempFile));
        const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
        const width = parseInt(videoStream.width);
        const height = parseInt(videoStream.height);
        
        // Calculate new dimensions maintaining aspect ratio and ensuring upscaling
        let newWidth, newHeight;
        const aspectRatio = width / height;
        
        if (width > height) {
            // Landscape orientation
            if (width < 1920) {
                newWidth = 1920;
                newHeight = Math.round(1920 / aspectRatio);
            } else {
                newWidth = width;
                newHeight = height;
            }
        } else {
            // Portrait orientation
            if (height < 1920) {
                newHeight = 1920;
                newWidth = Math.round(1920 * aspectRatio);
            } else {
                newHeight = height;
                newWidth = width;
            }
        }
        
        // Make sure dimensions are even numbers
        newWidth = Math.floor(newWidth / 2) * 2;
        newHeight = Math.floor(newHeight / 2) * 2;

        // Extract frames with proper resolution
        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i ${pndir}/${timestamp} -vf "fps=${fps},scale=${newWidth}:${newHeight}:flags=lanczos" ${fdir}/frame-%04d.png`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Process frames with remini
        const images = fs.readdirSync(fdir);
        let result = {};

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            result[image] = remini(fs.readFileSync(`${fdir}/${image}`), "enhance");
        }

        const values = await Promise.all(Object.values(result));
        Object.keys(result).forEach((key, index) => {
            result[key] = values[index];
        });

        // Save enhanced frames
        for (let i of Object.keys(result)) {
            fs.writeFileSync(`${rfdir}/${i}`, result[i]);
        }

        // Combine frames back into video with high quality settings
        await new Promise((resolve, reject) => {
            const ffmpegCommand = `ffmpeg -framerate ${fps} -i ${rfdir}/frame-%04d.png -i ${pndir}/${timestamp} `
                + `-c:v libx264 -preset slower -crf 18 -x264-params "aq-mode=3:aq-strength=0.8" `
                + `-vf "scale=${newWidth}:${newHeight}:flags=lanczos,format=yuv420p" `
                + `-maxrate 8M -bufsize 16M `
                + `-c:a aac -b:a 192k -ar 48000 `
                + `-movflags +faststart `
                + `-strict experimental -shortest ${rname}`;
            
            exec(ffmpegCommand, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Send result in HD
        await nvdia.sendMessage(sender, { 
            video: fs.readFileSync(rname),
            caption: `✨ Video telah ditingkatkan ke resolusi ${newWidth}x${newHeight}`,
            gifPlayback: false,
            jpegThumbnail: null,
            mimetype: 'video/mp4',
            height: newHeight,
            width: newWidth,
            headerType: 4
        }, { 
            quoted: msg,
            mediaUploadTimeoutMs: 1000 * 60 * 5
        });

        // Cleanup
        dirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

    } catch (error) {
        console.error('HD Video processing error:', error);
        await nvdia.sendMessage(sender, { text: `Error processing video: ${error.message}` }, { quoted: msg });
    }
}
break;
case 'removebg':
case 'enhance':
case 'upscale':
case 'restore':
case 'colorize': {
    await handlePxpic(nvdia, m, command);
}
break;
case 'waifu': {
    try {
        // Create tmp directory if it doesn't exist
        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Generate unique filename
        const filename = `${tmpDir}/anime-${Date.now()}.jpg`;

        // Fetch and download image
        const response = await axios({
            method: 'get',
            url: 'https://archive-ui.tanakadomp.biz.id/asupan/anime',
            responseType: 'arraybuffer'
        });

        // Save image to tmp folder
        fs.writeFileSync(filename, Buffer.from(response.data, 'binary'));

        // Send the image
        await nvdia.sendMessage(sender, {
            image: fs.readFileSync(filename),
            caption: `Ini waifunya...`,
        }, { quoted: msg });

        // Delete temporary file
        fs.unlinkSync(filename);

    } catch (error) {
        console.error("Error pada fitur anime:", error);
        
        let errorMsg = 'Terjadi kesalahan saat mengambil gambar anime.';
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMsg = 'API tidak dapat diakses. Silakan coba lagi nanti.';
            } else {
                errorMsg = 'Gagal mengambil data dari server. Silakan coba lagi.';
            }
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await reply(nvdia, msg, errorMsg);
    }
}
break;
case 'anilist': {
    if (!args[0]) {
        await nvdia.sendMessage(sender, { 
            text: `Masukan judul anime!\ncontoh:\n\n${prefixUsed + command} one piece` 
        }, { quoted: msg });
        return;
    }
    const query = args.join(' ');
    await handleAnilistSearch(nvdia, msg, query);
}
break;

case 'anilistinfo': {
    if (!args[0]) {
        await nvdia.sendMessage(sender, { 
            text: `Masukan link anime!\ncontoh:\n\n${prefixUsed + command} https://anilist.co/anime/...` 
        }, { quoted: msg });
        return;
    }
    const url = args[0];
    await handleAnilistDetail(nvdia, msg, url);
}
break;

case 'anilisttop': {
    await handleAnilistPopular(nvdia, msg);
}
break;

case 'amsearch': {
    if (!args[0]) {
        await nvdia.sendMessage(sender, { 
            text: `Masukan judul lagu/artist!\ncontoh:\n\n${prefixUsed + command} taylor swift` 
        }, { quoted: msg });
        return;
    }
    const query = args.join(' ');
    await handleAppleMusicSearch(nvdia, msg, query);
}
break;

case 'amdl': {
    if (!args[0]) {
        await nvdia.sendMessage(sender, { 
            text: `Masukan link Apple Music!\ncontoh:\n\n${prefixUsed + command} https://music.apple.com/...` 
        }, { quoted: msg });
        return;
    }
    const url = args[0];
    await handleAppleMusicDownload(nvdia, msg, url);
}
break;
default:
                if (budy.startsWith('=>')) {
                    if (!isCreator) return;
                    function Return(sul) {
                        sat = JSON.stringify(sul, null, 2);
                        bang = util.format(sat);
                        if (sat == undefined) {
                            bang = util.format(sul);
                        }
                        return nvdia.sendMessage(sender, { text: bang }, { quoted: msg });
                    }
                    try {
                        reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)));
                    } catch (e) {
                        nvdia.sendMessage(sender, { text: String(e) }, { quoted: msg });
                    }
                }

                if (budy.startsWith('>')) {
                    if (!isCreator) return;
                    let kode = budy.trim().split(/ +/)[0];
                    let teks;
                    try {
                        teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${q}})()`)
                    } catch (e) {
                        teks = e;
                    } finally {
                        await nvdia.sendMessage(sender, { text: require('util').format(teks) }, { quoted: msg });
                    }
                }

                if (budy.startsWith('$')) {
                    if (!isCreator) return;
                    exec(budy.slice(2), (error, stdout) => {
                        if (error) return nvdia.sendMessage(sender, { text: `${error}` }, { quoted: msg });
                        if (stdout) return nvdia.sendMessage(sender, { text: stdout }, { quoted: msg });
                    });
                }
        }
    } catch (error) {
        console.error('Error in message handler:', error);
        await reply(nvdia, msg, `Maaf, terjadi kesalahan: ${error.message}`);
    }

};


async function reply(nvdia, msg, replyText) {
    if (msg.key && msg.key.remoteJid) {
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: replyText,
            quoted: msg, 
        });
    }
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours} jam, ${minutes} menit, ${remainingSeconds} detik`;
}

// Watching file changes
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mwas updated!\x1b[0m');
    delete require.cache[file];
    require(file);
});

