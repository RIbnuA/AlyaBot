const axios = require('axios');

// Store search results in memory (using chat ID as key)
const userStates = new Map();

const handlePinApi = async (nvdia, msg, args) => {
    try {
        const sender = msg.key.remoteJid;

        // Check if args is provided
        if (!args.length) {
            await nvdia.sendMessage(sender, { 
                text: 'Masukan kata kunci!\ncontoh:\n\n!pin Alisa Mikhailovna Kujou',
                quoted: msg 
            });
            return;
        }

        // Send initial loading message
        await nvdia.sendMessage(sender, { 
            text: '🔍 Mencari gambar di Pinterest...',
            quoted: msg 
        });

        // Handle search query
        const query = args.join(' ');
        const searchUrl = `https://api.agatz.xyz/api/pinsearch?message=${encodeURIComponent(query)}`;
        const searchResponse = await axios.get(searchUrl);
        
        if (!searchResponse.data?.data?.length) {
            await nvdia.sendMessage(sender, {
                text: '❌ Tidak ada hasil ditemukan untuk pencarian tersebut.',
                quoted: msg
            });
            return;
        }

        const results = searchResponse.data.data.slice(0, 10); // Get first 10 results
        
        // Save results to state
        setState(sender, 'pinterest_search', {
            images: results,
            currentIndex: 0,
            query: query
        });

        // Send first result
        await sendSearchResult(nvdia, sender, msg, results[0], 1, results.length, query);

    } catch (error) {
        console.error('Error in Pinterest handler:', error);
        let errorMsg = 'Terjadi kesalahan saat mencari gambar.';
        
        if (error.response?.status === 404) {
            errorMsg = 'API tidak dapat diakses. Silakan coba lagi nanti.';
        } else if (error.code === 'ENOTFOUND') {
            errorMsg = 'Gagal mengakses server. Periksa koneksi internet Anda.';
        }
        
        await nvdia.sendMessage(msg.key.remoteJid, {
            text: errorMsg,
            quoted: msg
        });
    }
};

// Function to handle next command
const handleNext = async (nvdia, msg) => {
    const sender = msg.key.remoteJid;
    const state = getState(sender);

    if (!state || state.state !== 'pinterest_search') {
        await nvdia.sendMessage(sender, {
            text: '⚠️ Tidak ada pencarian Pinterest yang aktif. Gunakan !pin <kata kunci> untuk mencari gambar.',
            quoted: msg
        });
        return;
    }

    try {
        const { images, currentIndex, query } = state.data;
        const nextIndex = currentIndex + 1;

        // Check if we've reached the end
        if (nextIndex >= images.length) {
            await nvdia.sendMessage(sender, {
                text: '✅ Semua gambar telah ditampilkan. Gunakan !pin <kata kunci> untuk mencari gambar lain.',
                quoted: msg
            });
            userStates.delete(sender);
            return;
        }

        // Send next image
        await sendSearchResult(nvdia, sender, msg, images[nextIndex], nextIndex + 1, images.length, query);

        // Update state with new index
        setState(sender, 'pinterest_search', {
            ...state.data,
            currentIndex: nextIndex
        });

    } catch (error) {
        console.error("Error pada fitur next:", error);
        await nvdia.sendMessage(sender, {
            text: 'Gagal menampilkan gambar selanjutnya. Silakan coba lagi.',
            quoted: msg
        });
    }
};

// Function to handle stop command
const handleStop = async (nvdia, msg) => {
    const sender = msg.key.remoteJid;
    const state = getState(sender);

    if (!state || state.state !== 'pinterest_search') {
        await nvdia.sendMessage(sender, {
            text: '⚠️ Tidak ada pencarian Pinterest yang aktif.',
            quoted: msg
        });
        return;
    }

    userStates.delete(sender);
    await nvdia.sendMessage(sender, {
        text: '✅ Pencarian dihentikan.',
        quoted: msg
    });
};

// Helper function to send search result
const sendSearchResult = async (nvdia, sender, msg, result, currentNum, totalNum, query) => {
    const caption = `📌 Pinterest Image (${currentNum}/${totalNum})\n\n` +
                   `🔍 Hasil pencarian: "${query}"\n` +
                   `${result.grid_title ? `📝 Title: ${result.grid_title}\n` : ''}` +
                   `📅 Created: ${result.created_at}\n` +
                   `🔗 Pin URL: ${result.pin}\n\n` +
                   `Ketik *.next3* untuk gambar selanjutnya\n` +
                   `Ketik *.stop3* untuk mencari gambar lain`;

    await nvdia.sendMessage(sender, {
        image: { url: result.images_url },
        caption: caption
    }, { quoted: msg });
};

// Helper function to get state
const getState = (userId) => {
    return userStates.get(userId);
};

// Helper function to set state
const setState = (userId, stateName, data) => {
    userStates.set(userId, {
        state: stateName,
        data: data
    });
};

module.exports = { handlePinApi, handleNext, handleStop };