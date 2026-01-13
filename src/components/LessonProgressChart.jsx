import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './LessonProgressChart.module.css';

const LessonProgressChart = ({ history, title, onClose }) => {
    // Process history data for the chart
    // We expect history to be sorted by date/time ascending preferably, 
    // but we can sort just in case.
    const data = [...history]
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(entry => ({
            date: new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullDate: new Date(entry.timestamp).toLocaleString(),
            wpm: entry.wpm,
            accuracy: entry.accuracy
        }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipDate}>{payload[0].payload.fullDate}</p>
                    <p className={styles.tooltipWpm}>WPM: {payload[0].value}</p>
                    <p className={styles.tooltipAcc}>Accuracy: {payload[1].value}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.chartContainer}>
            <div className={styles.header}>
                <h3>Progress: {title}</h3>
                <button className={styles.closeButton} onClick={onClose}>
                    ← Back to Lessons
                </button>
            </div>
            
            {data.length < 2 ? (
                <div className={styles.placeholder}>
                    <p>Not enough data to show progress graph.</p>
                    <p>Complete this lesson at least twice to see your improvement!</p>
                </div>
            ) : (
                <div className={styles.graphWrapper}>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                                dataKey="date" 
                                stroke="#888" 
                                tick={{fill: '#888'}}
                            />
                            <YAxis 
                                stroke="#888" 
                                tick={{fill: '#888'}}
                                label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                                type="monotone" 
                                dataKey="wpm" 
                                stroke="var(--color-primary)" 
                                strokeWidth={2}
                                dot={{r: 4, fill: 'var(--color-primary)'}}
                                activeDot={{r: 8}}
                                name="WPM"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="accuracy" 
                                stroke="var(--color-success)" 
                                strokeWidth={2}
                                dot={false}
                                name="Accuracy"
                                hide={true} // Hidden by default, just for tooltip
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default LessonProgressChart;
