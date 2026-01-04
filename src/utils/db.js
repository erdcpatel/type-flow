/**
 * IndexedDB wrapper for persistent storage of typing stats and replays
 * This provides permanent storage that survives browser cache cleanup
 */

const DB_NAME = 'TypeFlowDB';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const REPLAYS_STORE = 'replays';

let dbInstance = null;

/**
 * Initialize and open the IndexedDB database
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create history object store
            if (!db.objectStoreNames.contains(HISTORY_STORE)) {
                const historyStore = db.createObjectStore(HISTORY_STORE, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                // Index by date for efficient daily queries
                historyStore.createIndex('dateString', 'dateString', { unique: false });
                historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                historyStore.createIndex('mode', 'mode', { unique: false });
            }

            // Create replays object store
            if (!db.objectStoreNames.contains(REPLAYS_STORE)) {
                db.createObjectStore(REPLAYS_STORE, { keyPath: 'key' });
            }
        };
    });
};

/**
 * Get local date string in YYYY-MM-DD format
 */
const getLocalDateString = (timestamp = Date.now()) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

/**
 * Save a typing result to history
 */
export const saveHistoryEntry = async (result, replayData = null) => {
    const db = await initDB();

    const entry = {
        ...result,
        timestamp: result.timestamp || Date.now(),
        dateString: getLocalDateString(result.timestamp || Date.now())
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([HISTORY_STORE], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE);
        const request = store.add(entry);

        request.onsuccess = async () => {
            // Handle replay data if this is a personal best
            if (replayData && result.wpm > 0) {
                const bestReplay = await getBestReplay(result.mode, result.level);
                if (!bestReplay || result.wpm > bestReplay.wpm) {
                    await saveReplay(result.mode, result.level, {
                        wpm: result.wpm,
                        data: replayData,
                        timestamp: entry.timestamp
                    });
                }
            }
            resolve(entry);
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Get all history entries
 */
export const getAllHistory = async () => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([HISTORY_STORE], 'readonly');
        const store = transaction.objectStore(HISTORY_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Save a replay (best performance for a mode/level)
 */
export const saveReplay = async (mode, level, replayEntry) => {
    const db = await initDB();
    const key = `${mode}_${level}`;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([REPLAYS_STORE], 'readwrite');
        const store = transaction.objectStore(REPLAYS_STORE);
        const request = store.put({ key, ...replayEntry });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Get best replay for a mode/level
 */
export const getBestReplay = async (mode, level) => {
    const db = await initDB();
    const key = `${mode}_${level}`;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([REPLAYS_STORE], 'readonly');
        const store = transaction.objectStore(REPLAYS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
            const result = request.result;
            resolve(result || null);
        };
        request.onerror = () => reject(request.error);
    });
};

/**
 * Clear all data (history and replays)
 */
export const clearAllData = async () => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([HISTORY_STORE, REPLAYS_STORE], 'readwrite');

        const historyStore = transaction.objectStore(HISTORY_STORE);
        const replaysStore = transaction.objectStore(REPLAYS_STORE);

        // clear object stores
        historyStore.clear();
        replaysStore.clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

/**
 * Migrate data from localStorage to IndexedDB
 */
export const migrateFromLocalStorage = async () => {
    try {
        // Check if we already have data in IndexedDB
        const existingHistory = await getAllHistory();
        if (existingHistory.length > 0) {
            console.log('IndexedDB already has data, skipping migration');
            return;
        }

        // Try to get data from localStorage
        const STORAGE_KEY = 'typeflow_history';
        const localData = localStorage.getItem(STORAGE_KEY);

        if (!localData) {
            console.log('No localStorage data to migrate');
            return;
        }

        const history = JSON.parse(localData);
        console.log(`Migrating ${history.length} entries from localStorage to IndexedDB`);

        // Migrate each entry
        const db = await initDB();
        const transaction = db.transaction([HISTORY_STORE], 'readwrite');
        const store = transaction.objectStore(HISTORY_STORE);

        for (const entry of history) {
            const migratedEntry = {
                ...entry,
                dateString: getLocalDateString(entry.timestamp)
            };
            store.add(migratedEntry);
        }

        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });

        // Migrate replays
        const replayKeys = Object.keys(localStorage).filter(key => key.startsWith('replay_'));
        if (replayKeys.length > 0) {
            const replayTransaction = db.transaction([REPLAYS_STORE], 'readwrite');
            const replayStore = replayTransaction.objectStore(REPLAYS_STORE);

            for (const key of replayKeys) {
                const replayData = JSON.parse(localStorage.getItem(key));
                const cleanKey = key.replace('replay_', '');
                replayStore.put({ key: cleanKey, ...replayData });
            }

            await new Promise((resolve, reject) => {
                replayTransaction.oncomplete = () => resolve();
                replayTransaction.onerror = () => reject(transaction.error);
            });
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};
