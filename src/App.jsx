import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTypingGame } from './hooks/useTypingGame';
import TypingArea from './components/TypingArea';
import ResultCard from './components/ResultCard';
import LessonSelector from './components/LessonSelector';
import StatsModal from './components/StatsModal';
import SettingsModal from './components/SettingsModal';
import GameOverModal from './components/GameOverModal';
import { saveResult, getHistory, getBestReplay, getStreak, getRecords } from './utils/storage';
import { DIFFICULTY_TEXTS } from './utils/texts';
import { LESSONS } from './utils/lessons';
import { generateLessonText } from './utils/generator';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState('practice'); // 'practice' | 'lesson' | 'custom'
  const [level, setLevel] = useState('basic');
  const [currentLessonId, setCurrentLessonId] = useState(LESSONS[0].id);
  const [history, setHistory] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customText, setCustomText] = useState('');
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [ghostReplay, setGhostReplay] = useState(null);
  const [streak, setStreak] = useState(0);
  const [bestWpm, setBestWpm] = useState(0);

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

  // Fetch best replay when configuration changes
  useEffect(() => {
    const loadReplay = async () => {
      let replay = null;
      if (mode === 'practice') {
        replay = await getBestReplay(mode, level);
      } else if (mode === 'lesson') {
        replay = await getBestReplay(mode, currentLessonId);
      }
      setGhostReplay(replay ? replay.data : null);
    };
    loadReplay();
  }, [mode, level, currentLessonId]);

  // Decide initial text based on mode
  const getInitialText = useCallback(() => {
    if (mode === 'practice') return DIFFICULTY_TEXTS[level];
    if (mode === 'lesson') {
      const lesson = LESSONS.find(l => l.id === currentLessonId);
      return generateLessonText(lesson?.keys);
    }
    return "";
  }, [mode, level, currentLessonId]);

  const inputRef = useRef(null);
  const savedRef = useRef(false);

  // Update hook usage
  const { text, userInput, status, handleInput, reset, stats, replayData, ghostIndex } = useTypingGame(getInitialText(), suddenDeath, ghostReplay);

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

        // Refresh ghost replay if we just set a new record
        if (mode === 'practice' || mode === 'lesson') {
          const replay = await getBestReplay(mode, mode === 'practice' ? level : currentLessonId);
          setGhostReplay(replay ? replay.data : null);
        }

        // Update streak and best WPM
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
    reset(newText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleLevelChange = (e) => {
    const newLevel = e.target.value;
    setLevel(newLevel);
    reset(DIFFICULTY_TEXTS[newLevel]);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLessonId(lesson.id);
    reset(generateLessonText(lesson.keys));
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    // Reset game with new mode's default
    if (newMode === 'practice') {
      reset(DIFFICULTY_TEXTS[level]);
    } else if (newMode === 'lesson') {
      const lesson = LESSONS.find(l => l.id === currentLessonId);
      reset(generateLessonText(lesson.keys));
    } else {
      reset("");
    }
    // Only focus if we have text to type
    if (newMode !== 'custom' && inputRef.current) inputRef.current.focus();
  };

  const handleStartDrill = (keys) => {
    setShowStats(false);
    setMode('practice');
    const drillText = generateLessonText(keys, 30);
    reset(drillText);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCustomTextSubmit = () => {
    if (!customText.trim()) return;
    reset(customText);
    if (inputRef.current) inputRef.current.focus();
  };



  return (
    <main className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <h1>TypeFlow</h1>
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
            data-tooltip="Game ends immediately on your first mistake!"
          >
            <input
              type="checkbox"
              checked={suddenDeath}
              onChange={(e) => setSuddenDeath(e.target.checked)}
            />
            <span className={styles.skull}>💀</span>
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
        {/* Practice Selector */}
        {mode === 'practice' && (
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

        <div className={styles.stats}>
          <div>WPM: <span className={styles.wpmValue}>{stats.wpm}</span></div>
          <div>ACC: <span className={styles.accValue}>{stats.accuracy}%</span></div>
          <div>STATUS: {status.toUpperCase()}</div>
        </div>

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
              disabled={status === 'finished'}
              inputRef={inputRef}
              ghostIndex={ghostIndex}
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
