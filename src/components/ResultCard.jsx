
import React, { useEffect } from 'react';
import styles from './ResultCard.module.css';

const ResultCard = ({ stats, history, onRestart }) => {
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

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <h2 className={styles.title}>Session Complete</h2>

                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <span className={styles.label}>WPM</span>
                        <span className={`${styles.value} ${styles.primary}`}>{stats.wpm}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.label}>Accuracy</span>
                        <span className={`${styles.value} ${styles.secondary}`}>{stats.accuracy}%</span>
                    </div>
                </div>

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
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>Perfect! No specific trouble keys.</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Mini chart visualization (last 10 entries) */}
                {history.length > 0 && (
                    <div className={styles.chartContainer}>
                        {history.slice(-15).map((entry, i) => {
                            const height = Math.min(100, Math.max(10, (entry.wpm / 100) * 100)); // cap at 100 wpm scale
                            return (
                                <div
                                    key={i}
                                    className={styles.bar}
                                    style={{
                                        height: `${height}%`,
                                        background: i === history.length - 1 ? 'var(--color-primary)' : undefined
                                    }}
                                    title={`WPM: ${entry.wpm}`}
                                />
                            );
                        })}
                    </div>
                )}

                <div className={styles.actions}>
                    <button className={`${styles.button} ${styles.primaryBtn}`} onClick={onRestart}>
                        Next Test <span style={{ opacity: 0.7, fontSize: '0.85em' }}>(Press Enter)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
