import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTypingGame } from './hooks/useTypingGame';
import TypingArea from './components/TypingArea';
import ResultCard from './components/ResultCard';
import LessonSelector from './components/LessonSelector';
import StatsModal from './components/StatsModal';
import SettingsModal from './components/SettingsModal';
import GameOverModal from './components/GameOverModal';
import { saveResult, getHistory, getBestReplay, getLastReplay, getStreak, getRecords } from './utils/storage';
import { DIFFICULTY_TEXTS } from './utils/texts';
import { LESSONS } from './utils/lessons';
import { generateLessonText } from './utils/generator';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState('practice'); // 'practice' | 'lesson' | 'custom'
  const [level, setLevel] = useState('basic');
  const [lessonLevel, setLessonLevel] = useState('basic'); // Lesson difficulty
  const [currentLessonId, setCurrentLessonId] = useState(LESSONS[0].id);
  const [history, setHistory] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customText, setCustomText] = useState('');
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [ghostReplay, setGhostReplay] = useState(null);
  const [streak, setStreak] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);
  const [lastText, setLastText] = useState(() => {
    // Initialize with the initial text so retry works on first load
    if (mode === 'practice') return DIFFICULTY_TEXTS[level];
    if (mode === 'lesson') {
      const lesson = LESSONS.find(l => l.id === currentLessonId);
      const wordCount = lessonLevel === 'basic' ? 20 : lessonLevel === 'intermediate' ? 40 : 60;
      return generateLessonText(lesson?.keys, wordCount);
    }
    return '';
  });

  // Initialize history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const data = await getHistory();
      setHistory(data);
      const streakData = await getStreak();
      setStreak(streakData);
      const recordsData = await getRecords();
      setBestWpm(recordsData?.bestWpm || 0);
    };
    loadHistory();
  }, []);

  // Fetch best replay when configuration changes - only load on explicit retry
  // Ghost is disabled for auto-load; it only appears when user clicks Retry
  useEffect(() => {
    // Clear ghost when mode/level changes (new test scenario)
    setGhostReplay(null);
  }, [mode, level, currentLessonId, lessonLevel]);

  // Decide initial text based on mode
  const getInitialText = useCallback(() => {
    if (mode === 'practice') return DIFFICULTY_TEXTS[level];
    if (mode === 'lesson') {
      const lesson = LESSONS.find(l => l.id === currentLessonId);
      const wordCount = lessonLevel === 'basic' ? 20 : lessonLevel === 'intermediate' ? 40 : 60;
      return generateLessonText(lesson?.keys, wordCount);
    }
    return "";
  }, [mode, level, currentLessonId, lessonLevel]);

  const inputRef = useRef(null);
  const savedRef = useRef(false);

  // Update hook usage
  const { text, userInput, status, handleInput, reset, stats, replayData, ghostIndex } = useTypingGame(getInitialText(), suddenDeath, ghostReplay);

  // Calculate if user beat the ghost
  const [beatGhost, setBeatGhost] = useState(null);
  const [wasRacingGhost, setWasRacingGhost] = useState(false);
  
  // Track if we started with a ghost (not auto-refreshed after finish)
  useEffect(() => {
    if (status === 'running' && ghostReplay) {
      setWasRacingGhost(true);
    } else if (status === 'running' && !ghostReplay) {
      // Reset when starting a new session without a ghost
      setWasRacingGhost(false);
    }
  }, [status, ghostReplay]);
  
  useEffect(() => {
    if (status === 'finished' && wasRacingGhost && ghostReplay) {
      // User finished - did they beat the ghost?
      // Only count correct characters for fair comparison
      const correctChars = userInput.split('').filter((char, index) => char === text[index]).length;
      const userFinished = correctChars === text.length;
      const ghostFinished = ghostIndex >= text.length;
      
      if (userFinished && !ghostFinished) {
        setBeatGhost(true);
      } else if (ghostFinished) {
        setBeatGhost(false);
      } else {
        setBeatGhost(null);
      }
    } else if (status === 'running') {
      // Reset when starting a new session
      setBeatGhost(null);
    }
  }, [status, wasRacingGhost, ghostReplay, userInput, text, ghostIndex]);

  // Handle saving when finished
  useEffect(() => {
    const saveResults = async () => {
      if (status === 'finished' && !savedRef.current) {
        const resultData = {
          ...stats,
          mode,
          level: mode === 'practice' ? level : (mode === 'lesson' ? currentLessonId : 'custom'),
          timestamp: Date.now()
        };
        // Pass replayData to saveResult
        const newHistory = await saveResult(resultData, replayData);
        setHistory(newHistory);
        savedRef.current = true;

        const streakData = await getStreak();
        setStreak(streakData);
        const recordsData = await getRecords();
        setBestWpm(recordsData?.bestWpm || 0);

      } else if (status === 'idle') {
        savedRef.current = false;
      }
    };
    saveResults();
  }, [status, stats, level, mode, currentLessonId, replayData]);

  const handleRestart = () => {
    let newText;
    if (mode === 'practice') {
      newText = DIFFICULTY_TEXTS[level];
    } else if (mode === 'lesson') {
      newText = generateLessonText(LESSONS.find(l => l.id === currentLessonId).keys);
    } else {
      newText = customText;
    }
    setLastText(newText);
    // Clear ghost for new test (not a retry)
    setGhostReplay(null);
    reset(newText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRetry = async () => {
    // Retry the same exact text - load ghost only if ghost mode is enabled
    if (lastText) {
      if (ghostMode) {
        const replayKey = mode === 'practice' ? level : (mode === 'lesson' ? currentLessonId : 'custom');
        const replay = await getLastReplay(mode, replayKey);
        if (replay) {
          setGhostReplay({ data: replay.data, wpm: replay.wpm });
        } else {
          setGhostReplay(null);
        }
      } else {
        setGhostReplay(null);
      }
      reset(lastText);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleLevelChange = (e) => {
    const newLevel = e.target.value;
    setLevel(newLevel);
    const newText = DIFFICULTY_TEXTS[newLevel];
    setLastText(newText);
    // Clear ghost for new level
    setGhostReplay(null);
    reset(newText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleLessonLevelChange = (e) => {
    const newLevel = e.target.value;
    setLessonLevel(newLevel);
    const lesson = LESSONS.find(l => l.id === currentLessonId);
    const wordCount = newLevel === 'basic' ? 20 : newLevel === 'intermediate' ? 40 : 60;
    const newText = generateLessonText(lesson.keys, wordCount);
    setLastText(newText);
    setGhostReplay(null);
    reset(newText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLessonId(lesson.id);
    const wordCount = lessonLevel === 'basic' ? 20 : lessonLevel === 'intermediate' ? 40 : 60;
    const newText = generateLessonText(lesson.keys, wordCount);
    setLastText(newText);
    // Clear ghost for new lesson
    setGhostReplay(null);
    reset(newText);
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    // Reset game with new mode's default
    let newText = '';
    if (newMode === 'practice') {
      newText = DIFFICULTY_TEXTS[level];
      reset(newText);
    } else if (newMode === 'lesson') {
      const lesson = LESSONS.find(l => l.id === currentLessonId);
      const wordCount = lessonLevel === 'basic' ? 20 : lessonLevel === 'intermediate' ? 40 : 60;
      newText = generateLessonText(lesson.keys, wordCount);
      reset(newText);
    } else {
      reset("");
    }
    setLastText(newText);
    // Only focus if we have text to type
    if (newMode !== 'custom' && inputRef.current) inputRef.current.focus();
  };

  const handleStartDrill = (keys) => {
    setShowStats(false);
    setMode('practice');
    const drillText = generateLessonText(keys, 30);
    setLastText(drillText);
    reset(drillText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCustomTextSubmit = () => {
    if (!customText.trim()) return;
    setLastText(customText);
    // Clear ghost for new custom text (will only show on retry)
    setGhostReplay(null);
    reset(customText);
    if (inputRef.current) inputRef.current.focus();
  };



  return (
    <main className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚡</span>
          <h1 className={styles.brandText}>TypeFlow</h1>
        </div>
        
        <div className={styles.navTabs}>
          {['practice', 'lesson', 'custom'].map(m => (
            <button
              key={m}
              onClick={() => toggleMode(m)}
              className={mode === m ? styles.activeTab : styles.tab}
            >
              {m}
            </button>
          ))}
        </div>

        <div className={styles.navActions}>
          {bestWpm > 0 && (
            <div className={styles.bestWpmDisplay} data-tooltip="Your personal best typing speed">
              <span className={styles.trophyIcon}>🏆</span>
              <span className={styles.bestWpmNumber}>{bestWpm}</span>
            </div>
          )}
          {streak > 0 && (
            <div className={styles.streakDisplay} data-tooltip="Current daily streak">
              <span className={styles.streakIcon}>🔥</span>
              <span className={styles.streakNumber}>{streak}</span>
            </div>
          )}
          <label 
            className={`${styles.suddenDeathToggle} ${suddenDeath ? styles.suddenDeathActive : ''}`}
            data-tooltip="Sudden Death: Game ends immediately on your first mistake!"
          >
            <input
              type="checkbox"
              checked={suddenDeath}
              onChange={(e) => {
                setSuddenDeath(e.target.checked);
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }, 0);
              }}
              onMouseDown={(e) => e.preventDefault()}
            />
            <span className={styles.skull}>💀</span>
          </label>
          <label 
            className={`${styles.ghostToggle} ${ghostMode ? styles.ghostActive : ''}`}
            data-tooltip="Ghost Mode: Race against your best performance when you retry"
          >
            <input
              type="checkbox"
              checked={ghostMode}
              onChange={(e) => {
                setGhostMode(e.target.checked);
                requestAnimationFrame(() => {
                  if (inputRef.current && status !== 'finished') {
                    inputRef.current.focus();
                  }
                });
              }}
            />
            <span className={styles.ghostIcon}>👻</span>
          </label>
          <button 
            className={styles.statsButton}
            onClick={() => setShowStats(true)}
            data-tooltip="View detailed statistics and progress"
          >
            📊
          </button>
          <button 
            className={styles.settingsButton}
            onClick={() => setShowSettings(true)}
            data-tooltip="Settings and preferences"
          >
            ⚙️
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Custom Text Input */}
        {mode === 'custom' && status === 'idle' && (
          <div className={styles.customTextArea}>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste your text here..."
            />
            <button
              onClick={handleCustomTextSubmit}
              disabled={!customText.trim()}
            >
              Start Typing
            </button>
          </div>
        )}
        {/* Race Bars - Completely outside text container */}
        {ghostReplay && status === 'running' && (() => {
          // Calculate correct characters only
          const correctChars = userInput.split('').filter((char, index) => char === text[index]).length;
          const userProgress = (correctChars / text.length) * 100;
          const ghostProgress = (ghostIndex / text.length) * 100;
          
          return (
            <div className={styles.raceContainer}>
              <div className={styles.raceBar}>
                <div className={styles.raceLabel}>You</div>
                <div className={styles.trackOuter}>
                  <div 
                    className={styles.yourBar}
                    style={{ width: `${Math.min(userProgress, 100)}%` }}
                  >
                    <span className={styles.barLabel}>{Math.round(userProgress)}%</span>
                  </div>
                </div>
              </div>
              <div className={styles.raceBar}>
                <div className={styles.raceLabel}>
                  <span className={styles.ghostEmoji}>👻</span> Ghost
                </div>
                <div className={styles.trackOuter}>
                  <div 
                    className={styles.ghostBar}
                    style={{ width: `${Math.min(ghostProgress, 100)}%` }}
                  >
                    <span className={styles.barLabel}>{Math.round(ghostProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <div className={styles.stats}>
          <div>WPM: <span className={styles.wpmValue}>{stats.wpm}</span></div>
          <div>ACC: <span className={styles.accValue}>{stats.accuracy}%</span></div>
          <div>STATUS: {status.toUpperCase()}</div>
          {status === 'running' && (
            <button className={styles.resetButton} onClick={handleRestart}>
              🔄 Reset
            </button>
          )}
        </div>

        {/* Practice Level Selector */}
        {mode === 'practice' && status === 'idle' && (
          <div className={styles.selector}>
            <select
              value={level}
              onChange={handleLevelChange}
              disabled={status === 'running'}
            >
              <option value="basic">Basic Mode</option>
              <option value="intermediate">Intermediate Mode</option>
              <option value="advanced">Advanced Mode</option>
            </select>
          </div>
        )}

        {/* Lesson Level Selector */}
        {mode === 'lesson' && status === 'idle' && (
          <div className={styles.selector}>
            <select
              value={lessonLevel}
              onChange={handleLessonLevelChange}
              disabled={status === 'running'}
            >
              <option value="basic">Basic (20 words)</option>
              <option value="intermediate">Intermediate (40 words)</option>
              <option value="advanced">Advanced (60 words)</option>
            </select>
          </div>
        )}

        {/* Lesson Selector (Only in Lesson Mode and Idle state to avoid distractions) */}
        {mode === 'lesson' && status === 'idle' && (
          <LessonSelector
            lessons={LESSONS}
            currentLessonId={currentLessonId}
            onSelect={handleLessonSelect}
          />
        )}

        <div className={styles.typingContainer}>
          <div style={{ marginBottom: '2rem' }}>
            <TypingArea
              text={text}
              userInput={userInput}
              onInput={handleInput}
              status={status}
              disabled={status === 'finished'}
              inputRef={inputRef}
            />
          </div>
        </div>
      </div>

      {status === 'failed' && (
        <GameOverModal onRestart={handleRestart} />
      )}

      {status === 'finished' && (
        <ResultCard
          stats={stats}
          history={history}
          onRestart={handleRestart}
          onRetry={handleRetry}
          beatGhost={beatGhost}
        />
      )}

      {/* Stats Modal */}
      {showStats && (
        <StatsModal onClose={() => setShowStats(false)} onStartDrill={handleStartDrill} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}

export default App;
