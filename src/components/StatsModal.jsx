import React, { useState, useEffect } from 'react';
import styles from './StatsModal.module.css';
import { getDailyStats, getStreak, getLessonProgress, getAggregateKeyStats, resetAllData, getHistory, getRecords } from '../utils/storage';
import { LESSONS } from '../utils/lessons';

const StatsModal = ({ onClose, onStartDrill }) => {
    const [stats, setStats] = useState(null);
    const [streak, setStreak] = useState(0);
    const [lessonStats, setLessonStats] = useState({});
    const [keyStats, setKeyStats] = useState({});
    const [history, setHistory] = useState([]);
    const [records, setRecords] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'records', 'lessons', 'keys'
    const [loading, setLoading] = useState(true);
    const [expandedTest, setExpandedTest] = useState(null);

    // Load all stats on mount
    useEffect(() => {
        const loadStats = async () => {
            try {
                const [dailyData, streakData, lessonData, keyData, historyData, recordsData] = await Promise.all([
                    getDailyStats(),
                    getStreak(),
                    getLessonProgress(),
                    getAggregateKeyStats(),
                    getHistory(),
                    getRecords()
                ]);
                setStats(dailyData);
                setStreak(streakData);
                setLessonStats(lessonData);
                setKeyStats(keyData);
                setHistory(historyData.sort((a, b) => b.timestamp - a.timestamp)); // Sort newest first
                setRecords(recordsData);
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

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
                    <div key={lesson.id} className={`${styles.lessonCard} ${!s ? styles.lessonCardEmpty : ''}`}>
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
                            <div className={styles.noDataInline}>Not started</div>
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

    const renderHistory = () => {
        if (history.length === 0) {
            return <div className={styles.noData}>No history recorded yet. Start typing!</div>;
        }

        return (
            <div className={styles.historyTable}>
                <div className={styles.tableHeader}>
                    <div>Date & Time</div>
                    <div>Mode</div>
                    <div>Level</div>
                    <div>WPM</div>
                    <div>Accuracy</div>
                </div>
                <div className={styles.tableBody}>
                    {history.map((test, index) => (
                        <React.Fragment key={test.id || index}>
                            <div 
                                className={`${styles.tableRow} ${expandedTest === index ? styles.expanded : ''}`}
                                onClick={() => setExpandedTest(expandedTest === index ? null : index)}
                            >
                                <div className={styles.dateCell}>
                                    <div>{new Date(test.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    <div className={styles.timeText}>{new Date(test.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className={styles.modeCell}>
                                    <span className={styles.modeBadge}>{test.mode}</span>
                                </div>
                                <div className={styles.levelCell}>{test.level}</div>
                                <div className={styles.wpmCell}>{test.wpm}</div>
                                <div className={styles.accCell}>{test.accuracy}%</div>
                            </div>
                            {expandedTest === index && test.keyStats && (
                                <div className={styles.expandedDetails}>
                                    <h4>Key Performance</h4>
                                    <div className={styles.miniKeysGrid}>
                                        {Object.entries(test.keyStats)
                                            .sort((a, b) => {
                                                const accA = ((a[1].total - a[1].errors) / a[1].total) * 100;
                                                const accB = ((b[1].total - b[1].errors) / b[1].total) * 100;
                                                return accA - accB;
                                            })
                                            .map(([key, data]) => {
                                                const acc = Math.round(((data.total - data.errors) / data.total) * 100);
                                                let color = 'var(--color-success)';
                                                if (acc < 80) color = 'var(--color-danger)';
                                                else if (acc < 94) color = 'var(--color-warning)';
                                                
                                                return (
                                                    <div key={key} className={styles.miniKeyItem} style={{ borderColor: color }}>
                                                        <span className={styles.miniKeyChar}>{key}</span>
                                                        <span className={styles.miniKeyAcc} style={{ color }}>{acc}%</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    const renderRecords = () => {
        if (!records || records.totalTests === 0) {
            return <div className={styles.noData}>No records yet. Start typing to set your first record!</div>;
        }

        return (
            <div>
                <h3 className={styles.sectionTitle}>Records by Mode</h3>
                <div className={styles.modeRecordsList}>
                    {Object.values(records.byMode)
                        .sort((a, b) => b.bestWpm - a.bestWpm)
                        .map((record, index) => (
                            <div key={index} className={styles.modeRecordItem}>
                                <div className={styles.modeRecordHeader}>
                                    <span className={styles.modeBadge}>{record.mode}</span>
                                    <span className={styles.levelBadge}>{record.level}</span>
                                </div>
                                <div className={styles.modeRecordStats}>
                                    <div>
                                        <span className={styles.recordStatLabel}>Best WPM:</span>
                                        <span className={styles.recordStatValue}>{record.bestWpm}</span>
                                    </div>
                                    <div>
                                        <span className={styles.recordStatLabel}>Best Acc:</span>
                                        <span className={styles.recordStatValue}>{record.bestAccuracy}%</span>
                                    </div>
                                    <div>
                                        <span className={styles.recordStatLabel}>Attempts:</span>
                                        <span className={styles.recordStatValue}>{record.attempts}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                        className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'records' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('records')}
                    >
                        Records
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
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'records' && renderRecords()}
                    {activeTab === 'lessons' && renderLessons()}
                    {activeTab === 'keys' && renderKeys()}
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
