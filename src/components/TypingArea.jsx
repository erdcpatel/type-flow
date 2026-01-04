
import React, { useEffect } from 'react';
import styles from './TypingArea.module.css';

const TypingArea = ({ text, userInput, onInput, status, inputRef, ghostIndex }) => {
    // Auto-focus on mount or status change to running
    useEffect(() => {
        if (status !== 'finished' && inputRef?.current) {
            inputRef.current.focus();
        }
    }, [status, inputRef]);

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

                    if (index === ghostIndex && status === 'running') {
                        className += ` ${styles.ghost}`;
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
