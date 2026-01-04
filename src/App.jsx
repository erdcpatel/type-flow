import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTypingGame } from './hooks/useTypingGame';
import TypingArea from './components/TypingArea';
import ResultCard from './components/ResultCard';
import LessonSelector from './components/LessonSelector';
import StatsModal from './components/StatsModal';
import GameOverModal from './components/GameOverModal';
import { saveResult, getHistory, getBestReplay } from './utils/storage';
import { DIFFICULTY_TEXTS } from './utils/texts';
import { LESSONS } from './utils/lessons';
import { generateLessonText } from './utils/generator';

function App() {
  const [mode, setMode] = useState('practice'); // 'practice' | 'lesson' | 'custom'
  const [level, setLevel] = useState('basic');
  const [currentLessonId, setCurrentLessonId] = useState(LESSONS[0].id);
  const [history, setHistory] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [customText, setCustomText] = useState('');
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [ghostReplay, setGhostReplay] = useState(null);

  // Initialize history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const data = await getHistory();
      setHistory(data);
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
    <main className="app-container" style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TypeFlow
        </h1>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          {['practice', 'lesson', 'custom'].map(m => (
            <button
              key={m}
              onClick={() => toggleMode(m)}
              style={{
                padding: '0.5rem 1.5rem',
                background: mode === m ? 'var(--color-primary)' : 'var(--glass-bg)',
                color: mode === m ? 'var(--color-bg)' : 'var(--color-text)',
                borderRadius: '20px',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Sudden Death Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: suddenDeath ? 'var(--color-danger, #ff4444)' : 'var(--color-text-muted)' }}>
            <input
              type="checkbox"
              checked={suddenDeath}
              onChange={(e) => setSuddenDeath(e.target.checked)}
              style={{ accentColor: 'var(--color-danger, #ff4444)' }}
            />
            <span style={{ fontWeight: suddenDeath ? 'bold' : 'normal' }}>💀 Sudden Death Mode</span>
          </label>
        </div>

        {/* Stats Button */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => setShowStats(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: 0.8
            }}
          >
            view detailed stats
          </button>
        </div>

        {/* Practice Selector */}
        {mode === 'practice' && (
          <div style={{ margin: '1rem 0' }}>
            <select
              value={level}
              onChange={handleLevelChange}
              disabled={status === 'running'}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'var(--glass-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--glass-border)',
                fontSize: '1rem',
                outline: 'none'
              }}
            >
              <option value="basic">Basic Mode</option>
              <option value="intermediate">Intermediate Mode</option>
              <option value="advanced">Advanced Mode</option>
            </select>
          </div>
        )}

        {/* Custom Text Input */}
        {mode === 'custom' && status === 'idle' && (
          <div style={{ maxWidth: '600px', margin: '0 auto 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste your text here..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '1rem',
                borderRadius: '12px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--color-text)',
                resize: 'vertical'
              }}
            />
            <button
              onClick={handleCustomTextSubmit}
              disabled={!customText.trim()}
              style={{
                padding: '0.75rem 2rem',
                background: 'var(--color-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: !customText.trim() ? 0.5 : 1
              }}
            >
              Start Typing
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div>WPM: <span style={{ color: 'var(--color-primary)', fontSize: '1.2em' }}>{stats.wpm}</span></div>
          <div>ACC: <span style={{ color: 'var(--color-secondary)', fontSize: '1.2em' }}>{stats.accuracy}%</span></div>
          <div>STATUS: {status.toUpperCase()}</div>
        </div>
      </header>

      {/* Lesson Selector (Only in Lesson Mode and Idle state to avoid distractions) */}
      {mode === 'lesson' && status === 'idle' && (
        <LessonSelector
          lessons={LESSONS}
          currentLessonId={currentLessonId}
          onSelect={handleLessonSelect}
        />
      )}

      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: 'var(--spacing-xl)',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 'var(--glass-shadow)',
        position: 'relative'
      }}>
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
    </main>
  );
}

export default App;
