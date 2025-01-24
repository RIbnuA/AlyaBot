const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { handleIncomingMessage } = require('./case');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs')

let nvdia;

const startConnection = async () => {
    console.log(chalk.blue.bold("\nStarting connection to whatsapp...\n"));

    // buat yg blm paham disini bakal buat folder, guna nya untuk simpan 
    // session kamu agar, ga scan lagi nantinya...
    const { state, saveCreds } = await useMultiFileAuthState("nvdiageforte");
    nvdia = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Mengelola update koneksi
    nvdia.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== 401);
            console.log(chalk.redBright("Koneksi terputus. Reconnecting..."));
            if (shouldReconnect) {
                startConnection();
            } else {
                console.log(chalk.red.bold("Autentikasi gagal. Silakan hapus folder 'nvdiageforte' dan coba lagi."));
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold("Bot berhasil terhubung ke WhatsApp!\n"));
        }
    });

    // disini bakal simpen session kamu, ke folder nvdiageforte.
    nvdia.ev.on('creds.update', saveCreds);

    nvdia.ev.on('messages.upsert', async (msgUpdate) => {
        const messages = msgUpdate.messages;
        if (!messages || messages.length === 0) return;

        const msg = messages[0];
        if (!msg.message) return;
        if (msg.key && msg.key.remoteJid === 'status@broadcast') return;
        if (msg.key.fromMe) return;
        
        // module.exports.handleIncomingMessage = case.js
        handleIncomingMessage(nvdia, msg);
    });

    // disini, mengecek apakah sudah melakukan pairing
    // atau belum.
    const alreadyRegistered = nvdia.authState.creds.registered;

    if (!alreadyRegistered) {
        console.log(chalk.yellow.bold("Akun belum terhubung. Silakan lakukan pairing terlebih dahulu.\n"));
        const pairingCode = await startPairing(nvdia);
        if (pairingCode) {
            console.log(chalk.yellow.bold(`Pairing code berhasil dibuat: ${pairingCode}`));
            console.log(chalk.cyanBright("Gunakan kode ini di aplikasi Anda untuk menyelesaikan koneksi.\n"));
        } else {
            console.log(chalk.redBright("Gagal membuat pairing code. Silakan coba lagi."));
        }
    } else {
        console.log(chalk.green.bold("Akun sudah terhubung. Tidak perlu melakukan pairing ulang."));
    }
};

// disini fungsi untuk pairing nya..
async function startPairing(nvdia) {
    console.log(chalk.cyan("Masukkan nomor telepon Anda (contoh: 6281234567890):"));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const phoneNumber = await new Promise((resolve) => rl.question('Nomor: ', resolve));
    rl.close();

    try {
        const pairingCode = await nvdia.requestPairingCode(phoneNumber);
        console.log(chalk.green("Kode pairing berhasil dibuat. Gunakan pairing code di aplikasi Anda."));
        return pairingCode;
    } catch (err) {
        console.error(chalk.red("Gagal membuat pairing code:"), err.message);
    }
}

startConnection();
let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
	require('fs').unwatchFile(file)
	console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
	delete require.cache[file]
	require(file)
})

