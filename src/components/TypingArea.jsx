
import React, { useEffect } from 'react';
import styles from './TypingArea.module.css';

const TypingArea = ({ text, userInput, onInput, status, inputRef }) => {
    // Auto-focus on mount or status change to running
    useEffect(() => {
        if (status !== 'finished' && inputRef?.current) {
            inputRef.current.focus();
        }
    }, [status, inputRef]);

    // Additional focus trigger when text changes (mode/level change)
    useEffect(() => {
        if (text && status === 'idle' && inputRef?.current) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    }, [text, status, inputRef]);

    const handleContainerClick = () => {
        if (inputRef?.current) inputRef.current.focus();
    };

    return (
        <div className={styles.container} onClick={handleContainerClick}>
            <input
                ref={inputRef}
                type="text"
                className={styles.input}
                value={userInput}
                onChange={onInput}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={status === 'finished'}
            />

            <div className={styles.display}>
                {text.split('').map((char, index) => {
                    let className = styles.char;

                    if (index < userInput.length) {
                        className += userInput[index] === char
                            ? ` ${styles.correct}`
                            : ` ${styles.incorrect}`;
                    } else if (index === userInput.length) {
                        className += ` ${styles.current}`;
                    }

                    return (
                        <span key={index} className={className}>
                            {char}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default TypingArea;
