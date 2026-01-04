
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage the typing game logic
 * @param {string} initialText - The text to type
 * @param {boolean} suddenDeath - If true, any mistake fails the game
 * @param {object} ghostReplay - Object with {data: timestamps[], wpm: number} of a previous best run
 */
export const useTypingGame = (initialText = "", suddenDeath = false, ghostReplay = null) => {
    const [text, setText] = useState(initialText);
    const [userInput, setUserInput] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | running | finished | failed
    const [keyStats, setKeyStats] = useState({}); // { 'a': { total: 10, errors: 2 } }

    // Ghost Mode State
    const [replayData, setReplayData] = useState([]); // [100, 250, 400...]ms relative to start
    const [ghostIndex, setGhostIndex] = useState(0);

    const reset = useCallback((newText = initialText) => {
        setText(newText);
        setUserInput("");
        setStartTime(null);
        setEndTime(null);
        setStatus("idle");
        setKeyStats({});
        setReplayData([]);
        setGhostIndex(0);
    }, [initialText]);

    // Ghost Playback Logic - Calculate ghost position based on WPM comparison
    useEffect(() => {
        if (status !== 'running' || !ghostReplay || !startTime) {
            if (status === 'running' && !ghostReplay) {
                console.log('⚠️ Ghost not available: No replay data');
            }
            return;
        }

        console.log('👻 Ghost mode ACTIVE - WPM:', ghostReplay.wpm);
        let animationFrameId;
        let lastLoggedIndex = -1;

        const updateGhost = () => {
            const now = Date.now();
            const elapsed = now - startTime;

            // Calculate ghost position based on WPM
            // Ghost WPM tells us characters per millisecond the ghost types at
            const ghostWpm = ghostReplay.wpm;
            if (!ghostWpm) {
                console.warn('❌ Ghost WPM is missing:', ghostReplay);
                return;
            }
            
            const ghostCharsPerMs = (ghostWpm * 5) / 60000; // WPM to chars/ms (5 chars = 1 word)
            
            // Calculate how many characters the ghost should have typed by now
            const ghostCharsTyped = Math.floor(elapsed * ghostCharsPerMs);
            const newIndex = Math.min(ghostCharsTyped, text.length);

            if (newIndex !== ghostIndex) {
                setGhostIndex(newIndex);
                // Log every 10 characters to avoid spam
                if (newIndex % 10 === 0 && newIndex !== lastLoggedIndex) {
                    console.log(`👻 Ghost at position ${newIndex}/${text.length}`);
                    lastLoggedIndex = newIndex;
                }
            }

            if (newIndex < text.length) {
                animationFrameId = requestAnimationFrame(updateGhost);
            }
        };

        animationFrameId = requestAnimationFrame(updateGhost);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [status, startTime, ghostReplay, ghostIndex, text.length]);

    const calculateStats = useCallback(() => {
        if (!startTime) return { wpm: 0, accuracy: 0, keyStats: {} };

        // Time in minutes
        const end = endTime || Date.now();
        const durationInMinutes = (end - startTime) / 60000;

        // Words = 5 characters
        const wordsTyped = userInput.length / 5;
        const wpm = durationInMinutes > 0 ? Math.round(wordsTyped / durationInMinutes) : 0;

        // Accuracy
        let rightChars = 0;
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] === text[i]) rightChars++;
        }
        const accuracy = userInput.length > 0 ? Math.round((rightChars / userInput.length) * 100) : 100;

        return { wpm, accuracy, keyStats };
    }, [userInput, text, startTime, endTime, keyStats]);

    const handleInput = useCallback((e) => {
        const value = e.target.value;

        if (status === "finished" || status === "failed") return;

        let currentStartTime = startTime;
        if (status === "idle") {
            currentStartTime = Date.now();
            setStartTime(currentStartTime);
            setStatus("running");
        }

        // Key Stats Tracking
        if (value.length > userInput.length) {
            // Character added
            const charIndex = value.length - 1;
            const expectedChar = text[charIndex];
            const typedChar = value[charIndex];

            // Record replay timestamp
            if (currentStartTime) {
                const timestamp = Date.now() - currentStartTime;
                setReplayData(prev => [...prev, timestamp]);
            }

            // Check for sudden death failure
            if (suddenDeath && typedChar !== expectedChar) {
                setStatus("failed");
                setEndTime(Date.now());
                setUserInput(value); // Show the wrong char
                return;
            }

            setKeyStats(prev => {
                const currentStat = prev[expectedChar] || { total: 0, errors: 0 };
                return {
                    ...prev,
                    [expectedChar]: {
                        total: currentStat.total + 1,
                        errors: typedChar !== expectedChar ? currentStat.errors + 1 : currentStat.errors
                    }
                };
            });
        }

        setUserInput(value);

        // Check if finished
        if (value.length === text.length) {
            setEndTime(Date.now());
            setStatus("finished");
        }
    }, [status, text, userInput, suddenDeath, startTime]);

    return {
        text,
        userInput,
        status,
        handleInput,
        reset,
        stats: calculateStats(),
        replayData,
        ghostIndex
    };
};
