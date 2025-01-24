const util = require('util');

const handleTest = async (nvdia, msg, text) => {
    if (!text) return reply(nvdia, msg, 'Masukkan kode yang ingin dijalankan!');
    
    try {
        // Format the code
        let code = text.trim();
        
        // Add return for expressions
        if (!code.includes('return') && !code.includes('await')) {
            code = `return ${code}`;
        }

        // Create async function to allow await
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction('nvdia, msg', code);
        
        console.log('Executing code:', code);
        
        // Execute the code
        const start = performance.now();
        const result = await fn(nvdia, msg);
        const executionTime = (performance.now() - start).toFixed(3);
        
        // Format the result
        const formattedResult = util.inspect(result, { depth: 2, colors: false });
        
        // Send response
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `*📝 Hasil Eksekusi:*\n` +
                  `\`\`\`${formattedResult}\`\`\`\n\n` +
                  `⏱️ Waktu eksekusi: ${executionTime}ms`,
            contextInfo: {
                externalAdReply: {
                    title: "Test Feature",
                    body: "Function Tester",
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: msg });
        
    } catch (error) {
        // Send error message
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: `*❌ Error:*\n\`\`\`${error.message}\`\`\``,
            contextInfo: {
                externalAdReply: {
                    title: "Test Feature Error",
                    body: "Function Tester",
                    mediaType: 1,
                    showAdAttribution: true
                }
            }
        }, { quoted: msg });
    }
};

const reply = async (nvdia, msg, text) => {
    await nvdia.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
};

module.exports = { handleTest };