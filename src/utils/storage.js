
import {
    initDB,
    saveHistoryEntry,
    getAllHistory,
    getBestReplay as getReplayFromDB,
    clearAllData,
    migrateFromLocalStorage
} from './db';

// Initialize DB and migrate on first load
let migrationPromise = null;
const ensureMigration = async () => {
    if (!migrationPromise) {
        migrationPromise = (async () => {
            await initDB();
            await migrateFromLocalStorage();
        })();
    }
    return migrationPromise;
};

export const saveResult = async (result, replayData = null) => {
    await ensureMigration();
    await saveHistoryEntry(result, replayData);
    return await getAllHistory();
};

export const getBestReplay = async (mode, level) => {
    await ensureMigration();
    return await getReplayFromDB(mode, level);
};

export const getHistory = async () => {
    await ensureMigration();
    return await getAllHistory();
};

export const clearHistory = async () => {
    await ensureMigration();
    await clearAllData();
};

export const resetAllData = async () => {
    await ensureMigration();
    await clearAllData();
};


export const calculateStatsFromHistory = (history) => {
    if (!history || history.length === 0) return { avgWpm: 0, highestWpm: 0, totalTests: 0 };

    const totalWpm = history.reduce((acc, curr) => acc + curr.wpm, 0);
    const highestWpm = Math.max(...history.map(h => h.wpm));

    return {
        avgWpm: Math.round(totalWpm / history.length),
        highestWpm,
        totalTests: history.length
    };
};


export const getDailyStats = async () => {
    const history = await getHistory();
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Group by date using the stored dateString
    const dailyGroups = history.reduce((acc, entry) => {
        const date = entry.dateString || new Date(entry.timestamp).toLocaleDateString('en-CA');
        if (!acc[date]) {
            acc[date] = {
                date,
                tests: 0,
                totalWpm: 0,
                totalTime: 0,
                modes: {}
            };
        }
        acc[date].tests++;
        acc[date].totalWpm += entry.wpm;
        return acc;
    }, {});

    const todayStats = dailyGroups[today] || {
        date: today,
        tests: 0,
        totalWpm: 0,
        modes: {}
    };

    return {
        today: {
            tests: todayStats.tests,
            avgWpm: todayStats.tests > 0 ? Math.round(todayStats.totalWpm / todayStats.tests) : 0
        },
        dailyHistory: Object.values(dailyGroups).sort((a, b) => new Date(b.date) - new Date(a.date))
    };
};


export const getStreak = async () => {
    const history = await getHistory();
    if (history.length === 0) return 0;

    // Get unique dates sorted descending using dateString
    const dates = [...new Set(history.map(h => h.dateString || new Date(h.timestamp).toLocaleDateString('en-CA')))]
        .sort((a, b) => new Date(b) - new Date(a));

    if (dates.length === 0) return 0;

    const today = new Date().toLocaleDateString('en-CA');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

    // Check if the most recent activity is today or yesterday
    const lastPlayed = dates[0];
    if (lastPlayed !== today && lastPlayed !== yesterday) {
        return 0;
    }

    let streak = 1;
    let currentDate = new Date(lastPlayed);

    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i]);
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() - 1);

        if (prevDate.toLocaleDateString('en-CA') === expectedDate.toLocaleDateString('en-CA')) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
};


export const getLessonProgress = async () => {
    const history = await getHistory();
    const progress = {};

    history.forEach(entry => {
        // specific lesson mode stats
        if (entry.mode === 'lesson' && entry.level) {
            const lessonId = entry.level;
            if (!progress[lessonId]) {
                progress[lessonId] = {
                    id: lessonId,
                    attempts: 0,
                    bestWpm: 0,
                    avgAccuracy: 0,
                    totalAccuracy: 0
                };
            }

            const p = progress[lessonId];
            p.attempts += 1;
            p.bestWpm = Math.max(p.bestWpm, entry.wpm);
            p.totalAccuracy += entry.accuracy;
        }
    });

    // Calculate averages
    Object.values(progress).forEach(p => {
        p.avgAccuracy = Math.round(p.totalAccuracy / p.attempts);
        delete p.totalAccuracy;
    });

    return progress;
};


export const getAggregateKeyStats = async () => {
    const history = await getHistory();
    const keyStats = {};

    history.forEach(entry => {
        if (entry.keyStats) {
            Object.entries(entry.keyStats).forEach(([key, stats]) => {
                if (!keyStats[key]) {
                    keyStats[key] = { total: 0, errors: 0 };
                }
                keyStats[key].total += stats.total;
                keyStats[key].errors += stats.errors;
            });
        }
    });

    // Calculate accuracy per key
    Object.keys(keyStats).forEach(key => {
        const k = keyStats[key];
        k.accuracy = k.total > 0
            ? Math.round(((k.total - k.errors) / k.total) * 100)
            : 0;
    });

    return keyStats;
};

export const getWeakKeys = async () => {
    const keyStats = await getAggregateKeyStats();
    const allKeys = Object.entries(keyStats);

    // Filter for keys with at least 5 attempts to be statistically significant
    const significantKeys = allKeys.filter(([, stats]) => stats.total >= 3);

    // If we don't have enough data, just return what we have sorted by accuracy
    if (significantKeys.length === 0) {
        return allKeys.sort((a, b) => a[1].accuracy - b[1].accuracy)
            .slice(0, 5)
            .map(([key]) => key);
    }

    // Find keys with accuracy < 90%
    const weakKeys = significantKeys
        .filter(([, stats]) => stats.errors > 0)
        .sort((a, b) => a[1].accuracy - b[1].accuracy)
        .map(([key]) => key);

    // If we found some weak keys, return them (up to 10)
    if (weakKeys.length > 0) {
        return weakKeys.slice(0, 10);
    }

    // If you are a typing god (>94% on everything), return your "relatively" worst keys
    return significantKeys
        .sort((a, b) => a[1].accuracy - b[1].accuracy)
        .slice(0, 5)
        .map(([key]) => key);
};
