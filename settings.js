async function handleSettings(nvdia, msg){
const moment = require("moment-timezone");
const pushname = msg.pushName || 'User';
const jam = moment().tz(timezone).format('dddd DD-MM-YYYY HH:mm:ss');

global.packname = `Sticker by ${pushname}`
global.author = `Dibuat pada\n ${jam}`
}
global.ftreply = [
"https://files.catbox.moe/2f2imr.jpeg",
"https://files.catbox.moe/qgc6m4.jpeg",
"https://files.catbox.moe/mlaj5t.jpeg",
"https://files.catbox.moe/q0jfap.jpeg",
"https://files.catbox.moe/em2rgi.jpg",
"https://files.catbox.moe/bt7abl.jpg",
"https://files.catbox.moe/qvh006.jpg"
]
global.pairing = '6288228768785'
global.owner = '6281391620354'
global.nomorbot = '6288228768785@s.whatsapp.net'
