const StateManager = require('../App/stateManager');

// Konfigurasi untuk setiap tipe konten tetap sama
const ContentTypes = {
    PINTEREST: 'pinterest',
    INSTAGRAM_REELS: 'igreels',
};

const contentConfig = {
    [ContentTypes.PINTEREST]: {
        stateKey: 'pinterest_search',
        itemName: 'gambar',
        command: 'pinterest',
        itemKey: 'images',
        messageFormat: (item, data, currentIndex) => ({
            type: 'image',
            content: { url: item.url },
            caption: `${item.caption}\n\n*Hasil pencarian untuk:* "${data.query}"\n*Image:* ${currentIndex + 1}/${data.images.length}\n\nKetik *.next* untuk gambar selanjutnya\nKetik *.stop* untuk mencari gambar lain`
        })
    },
    [ContentTypes.INSTAGRAM_REELS]: {
        stateKey: 'igreels_search',
        itemName: 'reels',
        command: 'igreels',
        itemKey: 'reels',
        messageFormat: (item, data, currentIndex) => ({
            type: 'video',
            content: { url: item.url },
            caption: `${item.caption}\n\n*Hasil pencarian untuk:* "${data.query}"\n*Reels:* ${currentIndex + 1}/${data.reels.length}\n\nKetik *.next* untuk reels selanjutnya\nKetik *.stop* untuk berhenti`,
            options: { gifPlayback: false }
        })
    }
};

const handleNext = async (nvdia, msg, sender, ...contentTypes) => {
    try {
        let foundActiveSearch = false;
        let noMoreContent = false;

        for (const contentType of contentTypes) {
            const config = contentConfig[contentType];
            if (!config) continue;

            const data = StateManager.getState(sender, config.stateKey);
            console.log(`Checking ${contentType} data:`, data); // Debug log

            if (!data || !data[config.itemKey] || !Array.isArray(data[config.itemKey])) {
                continue;
            }

            foundActiveSearch = true;
            const nextIndex = data.currentIndex + 1;

            // Cek apakah masih ada konten berikutnya
            if (nextIndex >= data[config.itemKey].length) {
                noMoreContent = true;
                continue;
            }

            // Ada konten berikutnya, kirim ke user
            const currentItem = data[config.itemKey][nextIndex];
            const messageData = config.messageFormat(currentItem, data, nextIndex);

            await nvdia.sendMessage(sender, {
                [messageData.type]: messageData.content,
                caption: messageData.caption,
                ...messageData.options
            }, { quoted: msg });

            // Update state dengan index baru
            StateManager.setState(sender, config.stateKey, {
                ...data,
                currentIndex: nextIndex
            });

            return; // Keluar setelah mengirim konten
        }

        // Kirim pesan yang sesuai berdasarkan kondisi
        if (!foundActiveSearch) {
            await nvdia.sendMessage(sender, {
                text: 'Tidak ada pencarian yang aktif. Silakan lakukan pencarian terlebih dahulu menggunakan *.pinterest* atau *.igreels*'
            }, { quoted: msg });
        } else if (noMoreContent) {
            await nvdia.sendMessage(sender, {
                text: 'Semua konten sudah ditampilkan. Silakan lakukan pencarian baru.'
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error in handleNext:', error);
        await nvdia.sendMessage(sender, {
            text: 'Terjadi kesalahan saat mengambil konten selanjutnya. Silakan coba lagi.'
        }, { quoted: msg });
    }
};

const handleStop = async (nvdia, msg, sender, ...contentTypes) => {
    try {
        let foundActiveSearch = false;

        for (const contentType of contentTypes) {
            const config = contentConfig[contentType];
            if (!config) continue;

            const data = StateManager.getState(sender, config.stateKey);
            if (!data) continue;

            foundActiveSearch = true;
            StateManager.clearState(sender, config.stateKey);
            await nvdia.sendMessage(sender, {
                text: `Pencarian ${config.itemName} telah dihentikan. Silakan lakukan pencarian baru.`
            }, { quoted: msg });
            return;
        }

        if (!foundActiveSearch) {
            await nvdia.sendMessage(sender, {
                text: 'Tidak ada pencarian yang aktif untuk dihentikan.'
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error in handleStop:', error);
        await nvdia.sendMessage(sender, {
            text: 'Terjadi kesalahan saat menghentikan pencarian. Silakan coba lagi.'
        }, { quoted: msg });
    }
};

module.exports = {
    handleNext,
    handleStop,
    contentConfig
};
