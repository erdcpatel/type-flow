import React, { useState, useEffect } from 'react';
import styles from './StatsModal.module.css';
import { getDailyStats, getStreak, getLessonProgress, getAggregateKeyStats, resetAllData } from '../utils/storage';
import { LESSONS } from '../utils/lessons';

const StatsModal = ({ onClose, onStartDrill }) => {
    const [stats, setStats] = useState(null);
    const [streak, setStreak] = useState(0);
    const [lessonStats, setLessonStats] = useState({});
    const [keyStats, setKeyStats] = useState({});
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'lessons', 'keys'
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load all stats on mount
    useEffect(() => {
        const loadStats = async () => {
            try {
                const [dailyData, streakData, lessonData, keyData] = await Promise.all([
                    getDailyStats(),
                    getStreak(),
                    getLessonProgress(),
                    getAggregateKeyStats()
                ]);
                setStats(dailyData);
                setStreak(streakData);
                setLessonStats(lessonData);
                setKeyStats(keyData);
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleReset = async () => {
        try {
            await resetAllData();
            // Reload stats after reset
            const [dailyData, streakData, lessonData, keyData] = await Promise.all([
                getDailyStats(),
                getStreak(),
                getLessonProgress(),
                getAggregateKeyStats()
            ]);
            setStats(dailyData);
            setStreak(streakData);
            setLessonStats(lessonData);
            setKeyStats(keyData);
            setShowResetConfirm(false);
        } catch (error) {
            console.error('Failed to reset data:', error);
        }
    };

    // Handle keyboard events for reset confirmation
    useEffect(() => {
        if (!showResetConfirm) return;

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleReset();
            } else if (e.key === 'Escape') {
                setShowResetConfirm(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showResetConfirm]);

    if (loading) {
        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading stats...</div>
                </div>
            </div>
        );
    }


    const renderOverview = () => (
        <>
            <div className={styles.streakContainer}>
                <div className={styles.streakCard}>
                    <span className={styles.streakValue}>🔥 {streak}</span>
                    <span className={styles.streakLabel}>Day Streak</span>
                </div>
            </div>

            <h3 className={styles.sectionTitle}>Today's Activity</h3>
            <div className={styles.grid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.today.tests}</span>
                    <span className={styles.statLabel}>Tests Completed</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.today.avgWpm}</span>
                    <span className={styles.statLabel}>Avg WPM</span>
                </div>
            </div>

            <h3 className={styles.sectionTitle}>Recent History</h3>
            <div className={styles.historyList}>
                {stats.dailyHistory.slice(0, 5).map((day, i) => (
                    <div key={i} className={styles.historyItem}>
                        <span className={styles.historyDate}>
                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <span>{day.tests} tests</span>
                            <span style={{ color: 'var(--color-primary)' }}>{Math.round(day.totalWpm / day.tests)} WPM avg</span>
                        </div>
                    </div>
                ))}
                {stats.dailyHistory.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem' }}>
                        No history recorded yet. Start typing!
                    </div>
                )}
            </div>
        </>
    );

    const renderLessons = () => (
        <div className={styles.lessonsGrid}>
            {LESSONS.map(lesson => {
                const s = lessonStats[lesson.id];
                return (
                    <div key={lesson.id} className={styles.lessonCard}>
                        <div className={styles.lessonHeader}>
                            <strong>{lesson.title}</strong>
                            {s && <span className={styles.badge}>{s.attempts} attempts</span>}
                        </div>
                        {s ? (
                            <div className={styles.lessonStats}>
                                <div className={styles.miniStat}>
                                    <span className={styles.label}>Best WPM</span>
                                    <span className={styles.value}>{s.bestWpm}</span>
                                </div>
                                <div className={styles.miniStat}>
                                    <span className={styles.label}>Avg Acc</span>
                                    <span className={styles.value}>{s.avgAccuracy}%</span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.noData}>Not started yet</div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderKeys = () => {
        const sortedKeys = Object.entries(keyStats).sort((a, b) => a[1].accuracy - b[1].accuracy);

        if (sortedKeys.length === 0) {
            return <div className={styles.noData}>Type more to see key analytics!</div>;
        }

        // Logic to show "Smart Drill" button
        // We can just use the storage utility or re-derive simple logic here
        // Since we have sortedKeys, let's just pick the worst ones for visual feedback
        const weakKeys = sortedKeys
            .filter(([, data]) => data.accuracy < 94)
            .map(([key]) => key);

        // If no specifically "weak" keys (all > 94%), just pick the bottom 5
        const drillKeys = weakKeys.length > 0
            ? weakKeys.slice(0, 10)
            : sortedKeys.slice(0, 5).map(([key]) => key);

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Key Accuracy (Worst to Best)</h3>
                    {drillKeys.length > 0 && (
                        <button
                            className={styles.driftButton}
                            onClick={() => onStartDrill(drillKeys)}
                        >
                            🎯 Practice Weak Keys
                        </button>
                    )}
                </div>

                <div className={styles.keysGrid}>
                    {sortedKeys.map(([key, data]) => {
                        let color = 'var(--color-success)';
                        if (data.accuracy < 80) color = 'var(--color-danger)';
                        else if (data.accuracy < 94) color = 'var(--color-warning)';

                        return (
                            <div key={key} className={styles.keyStatItem} style={{ borderColor: color }}>
                                <div className={styles.keyChar}>{key}</div>
                                <div className={styles.keyData}>
                                    <div className={styles.keyAcc} style={{ color }}>{data.accuracy}%</div>
                                    <div className={styles.keyCount}>{data.total} presses</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                <div className={styles.header}>
                    <h2>Your Progress</h2>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'lessons' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('lessons')}
                    >
                        Lessons
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'keys' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('keys')}
                    >
                        Keys
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'lessons' && renderLessons()}
                    {activeTab === 'keys' && renderKeys()}
                </div>

                {/* Reset Button */}
                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: 'transparent',
                            color: 'var(--color-danger, #ff4444)',
                            border: '1px solid var(--color-danger, #ff4444)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            opacity: 0.8,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.background = 'rgba(255, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.opacity = '0.8';
                            e.target.style.background = 'transparent';
                        }}
                    >
                        🗑️ Reset All Stats
                    </button>
                </div>

                {/* Reset Confirmation Dialog */}
                {showResetConfirm && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        zIndex: 10
                    }}>
                        <div style={{
                            background: 'var(--color-bg)',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid var(--color-danger, #ff4444)',
                            maxWidth: '400px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger, #ff4444)' }}>⚠️ Confirm Reset</h3>
                            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                                This will permanently delete all your typing history, stats, and replays. This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--glass-bg)',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel <span style={{ opacity: 0.6, fontSize: '0.85em' }}>(Esc)</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--color-danger, #ff4444)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Yes, Reset Everything <span style={{ opacity: 0.8, fontSize: '0.85em' }}>(Enter)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsModal;
