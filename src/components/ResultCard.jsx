
import React, { useEffect, useState } from 'react';
import styles from './ResultCard.module.css';
import { getRecentAverage, getPercentileRank } from '../utils/storage';

const ResultCard = ({ stats, history, onRestart, onRetry, beatGhost }) => {
    const [recentAvg, setRecentAvg] = useState(null);
    const [percentile, setPercentile] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load comparison data
    useEffect(() => {
        const loadComparisons = async () => {
            const avg = await getRecentAverage(10);
            const rank = await getPercentileRank(stats.wpm);
            setRecentAvg(avg);
            setPercentile(rank);
        };
        loadComparisons();
    }, [stats.wpm]);

    // Trigger celebration when beatGhost is set (separate effect)
    useEffect(() => {
        if (beatGhost !== null) {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [beatGhost]);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                onRestart();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onRestart]);

    // Calculate if this is a personal best
    const isPersonalBest = history.length > 0 && stats.wpm >= Math.max(...history.map(h => h.wpm));
    const wpmDiff = recentAvg && recentAvg.count > 0 ? stats.wpm - recentAvg.wpm : null;
    const accDiff = recentAvg && recentAvg.count > 0 ? stats.accuracy - recentAvg.accuracy : null;

    return (
        <div className={styles.overlay}>
            {/* Victory Celebration */}
            {showCelebration && beatGhost === true && (
                <>
                    <div className={styles.particleBurst}>
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div 
                                key={i} 
                                className={styles.particle}
                                style={{
                                    '--angle': `${(360 / 30) * i}deg`,
                                    '--delay': `${i * 0.02}s`,
                                    '--color': i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#60efff' : '#a78bfa'
                                }}
                            />
                        ))}
                    </div>
                    <div className={styles.victoryText}>
                        <span className={styles.victoryEmoji}>🏆</span>
                        <span className={styles.victoryMessage}>CRUSHED IT!</span>
                        <span className={styles.victorySubtext}>Ghost left in the dust</span>
                    </div>
                </>
            )}
            
            {/* Ghost Wins */}
            {showCelebration && beatGhost === false && (
                <>
                    <div className={styles.ghostReveal}>
                        <div className={styles.bigGhost}>👻</div>
                        <div className={styles.ghostMessage}>HAUNTED!</div>
                        <div className={styles.ghostSubtext}>Your past self is faster... for now</div>
                    </div>
                    <div className={styles.ghostTrail}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={styles.trailGhost} style={{ '--index': i }}>👻</span>
                        ))}
                    </div>
                </>
            )}
            
            <div className={styles.card}>
                <h2 className={styles.title}>
                    {isPersonalBest && '🏆 '}Session Complete{isPersonalBest && ' - New Record!'}
                </h2>

                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.label}>WPM</span>
                        <div>
                            <span className={`${styles.value} ${styles.primary}`}>{stats.wpm}</span>
                            {wpmDiff !== null && (
                                <span className={styles.diff} style={{ color: wpmDiff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {wpmDiff >= 0 ? '↑' : '↓'} {Math.abs(wpmDiff)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.label}>Accuracy</span>
                        <div>
                            <span className={`${styles.value} ${styles.secondary}`}>{stats.accuracy}%</span>
                            {accDiff !== null && (
                                <span className={styles.diff} style={{ color: accDiff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {accDiff >= 0 ? '↑' : '↓'} {Math.abs(accDiff)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance Context */}
                {percentile !== null && recentAvg && recentAvg.count > 0 && (
                    <div className={styles.contextBox}>
                        <div className={styles.contextItem}>
                            <span className={styles.contextLabel}>Your Recent Average</span>
                            <span className={styles.contextValue}>{recentAvg.wpm} WPM · {recentAvg.accuracy}% Acc</span>
                        </div>
                        <div className={styles.contextItem}>
                            <span className={styles.contextLabel}>Percentile Rank</span>
                            <span className={styles.contextValue}>
                                Top {100 - percentile}% of your tests
                            </span>
                        </div>
                    </div>
                )}

                {/* Key Analysis */}
                {stats.keyStats && Object.keys(stats.keyStats).length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'left' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Trouble Keys</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.entries(stats.keyStats)
                                .filter(([, stat]) => stat.errors > 0)
                                .sort((a, b) => b[1].errors - a[1].errors)
                                .slice(0, 5) // Top 5 worst keys
                                .map(([key, stat]) => (
                                    <div key={key} style={{
                                        background: 'rgba(255,100,100,0.1)',
                                        border: '1px solid rgba(255,100,100,0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                    }}>
                                        <strong style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{key}</strong>
                                        <span style={{ marginLeft: '6px', color: 'var(--color-secondary)' }}>{stat.errors} miss</span>
                                    </div>
                                ))}
                            {Object.values(stats.keyStats).every(s => s.errors === 0) && (
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>✨ Perfect! No trouble keys this session.</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Progress Chart - Only show if we have enough data */}
                {history.length >= 3 && (
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ 
                            fontSize: '1rem', 
                            color: 'var(--color-text-muted)', 
                            marginBottom: '0.5rem',
                            textAlign: 'left'
                        }}>
                            Recent Progress
                            <span style={{ 
                                fontSize: '0.8rem', 
                                marginLeft: '0.5rem', 
                                opacity: 0.7 
                            }}>
                                (Last {Math.min(15, history.length)} tests)
                            </span>
                        </h3>
                        <div className={styles.chartContainer}>
                            {(() => {
                                const recentTests = history.slice(-15);
                                const wpmValues = recentTests.map(e => e.wpm);
                                const minWpm = Math.min(...wpmValues);
                                const maxWpm = Math.max(...wpmValues);
                                const wpmRange = maxWpm - minWpm || 1; // Avoid division by zero
                                
                                return recentTests.map((entry, i) => {
                                    // Scale relative to data range: 10% (min WPM) to 100% (max WPM)
                                    const normalized = (entry.wpm - minWpm) / wpmRange;
                                    const height = Math.round(normalized * 90 + 10);
                                    const isCurrentTest = i === recentTests.length - 1;
                                    return (
                                        <div
                                            key={i}
                                            className={`${styles.bar} ${isCurrentTest ? styles.currentBar : ''}`}
                                            style={{ height: `${height}%` }}
                                            title={`${entry.wpm} WPM${isCurrentTest ? ' (Current)' : ''} • ${entry.accuracy}% accuracy`}
                                        />
                                    );
                                });
                            })()}
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '0.75rem', 
                            color: 'var(--color-text-muted)',
                            marginTop: '0.25rem',
                            paddingLeft: '1rem',
                            paddingRight: '1rem'
                        }}>
                            <span>Older</span>
                            <span style={{ color: 'var(--color-primary)' }}>← Current</span>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <button 
                        className={`${styles.button} ${styles.secondaryBtn}`} 
                        onClick={onRetry}
                        title="Retry the same text to beat your time"
                    >
                        🔄 Retry
                    </button>
                    <button className={`${styles.button} ${styles.primaryBtn}`} onClick={onRestart}>
                        Next Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
