
import React from 'react';
import styles from './LessonSelector.module.css';

const LessonSelector = ({ lessons, currentLessonId, onSelect }) => {
    return (
        <div className={styles.grid}>
            {lessons.map((lesson) => (
                <button
                    key={lesson.id}
                    className={`${styles.card} ${lesson.id === currentLessonId ? styles.active : ''}`}
                    onClick={() => onSelect(lesson)}
                >
                    <h3 className={styles.title}>{lesson.title}</h3>
                    <p className={styles.description}>{lesson.description}</p>
                    <div className={styles.keys}>
                        {lesson.keys.slice(0, 10).join(' ')}{lesson.keys.length > 10 ? '...' : ''}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default LessonSelector;
