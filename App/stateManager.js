// StateManager.js

// Menyimpan state untuk semua user
const userStates = new Map();

// Fungsi untuk membuat unique key berdasarkan userId dan stateKey
const createStateKey = (userId, stateKey) => `${userId}:${stateKey}`;

// Fungsi untuk membersihkan state yang expired secara periodik
const cleanupExpiredStates = () => {
    const now = Date.now();
    for (const [key, state] of userStates.entries()) {
        if (state.timestamp && now - state.timestamp > state.expiryTime) {
            userStates.delete(key);
        }
    }
};

// Jalankan cleanup setiap 10 menit
setInterval(cleanupExpiredStates, 10 * 60 * 1000);

const StateManager = {
    // Menyimpan state untuk user tertentu
    setState: (userId, stateKey, data, expiryTime = 30 * 60 * 1000) => {
        const key = createStateKey(userId, stateKey);
        userStates.set(key, {
            ...data,
            timestamp: Date.now(),
            expiryTime
        });
    },

    // Mengambil state untuk user tertentu
    getState: (userId, stateKey) => {
        const key = createStateKey(userId, stateKey);
        const state = userStates.get(key);
        
        if (!state) return null;

        // Cek apakah state sudah expired
        if (state.timestamp && Date.now() - state.timestamp > state.expiryTime) {
            userStates.delete(key);
            return null;
        }

        return state;
    },

    // Menghapus state untuk user tertentu
    clearState: (userId, stateKey) => {
        const key = createStateKey(userId, stateKey);
        userStates.delete(key);
    },

    // Mendapatkan semua active states untuk user tertentu
    getUserActiveStates: (userId) => {
        const userActiveStates = new Map();
        const now = Date.now();

        for (const [key, state] of userStates.entries()) {
            if (key.startsWith(`${userId}:`)) {
                if (!state.timestamp || now - state.timestamp <= state.expiryTime) {
                    const stateKey = key.split(':')[1];
                    userActiveStates.set(stateKey, state);
                } else {
                    userStates.delete(key);
                }
            }
        }

        return userActiveStates;
    },

    // Menghapus semua state untuk user tertentu
    clearUserStates: (userId) => {
        for (const [key] of userStates.entries()) {
            if (key.startsWith(`${userId}:`)) {
                userStates.delete(key);
            }
        }
    }
};

module.exports = StateManager;
