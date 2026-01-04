# AI Agent Guide for TypeFlow

This document is designed to help AI coding assistants understand the TypeFlow project structure, conventions, and best practices for making effective contributions.

## 🎯 Project Overview

**TypeFlow** is a React-based typing speed trainer with:
- **Local-first architecture** using IndexedDB
- **Privacy-focused** (no server, no tracking)
- **Progressive lessons** for skill improvement
- **Advanced analytics** for performance tracking

## 📋 Quick Reference

### Key Files to Understand

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/App.jsx` | Main app logic, mode switching | Adding new modes or global features |
| `src/hooks/useTypingGame.js` | Core typing game logic | Changing game mechanics or calculations |
| `src/utils/db.js` | IndexedDB wrapper | Modifying storage schema |
| `src/utils/storage.js` | Storage operations & analytics | Adding new analytics or data operations |
| `src/components/StatsModal.jsx` | Statistics display | Adding new stats visualizations |
| `src/utils/lessons.js` | Lesson definitions | Adding or modifying lessons |

### Project Structure

```
src/
├── components/       # React UI components
│   ├── *.jsx        # Component logic
│   └── *.module.css # Scoped styles
├── hooks/           # Custom React hooks
├── utils/           # Pure functions and utilities
│   ├── db.js       # IndexedDB operations
│   ├── storage.js  # High-level storage API
│   ├── generator.js # Text generation
│   ├── lessons.js  # Lesson data
│   └── texts.js    # Practice texts
├── App.jsx          # Main application
└── main.jsx         # Entry point
```

## 🔧 Common Tasks

### Adding a New Feature

1. **Identify the layer:**
   - UI change? → `components/`
   - Game logic? → `hooks/useTypingGame.js`
   - Data operation? → `utils/storage.js`
   - Storage schema? → `utils/db.js`

2. **Follow existing patterns:**
   - Use functional components with hooks
   - Use CSS Modules for styling
   - Keep components focused and small
   - Use async/await for storage operations

3. **Test thoroughly:**
   - Manual testing in all modes
   - Check browser console for errors
   - Test data persistence (refresh browser)
   - Verify across different browsers if possible

### Modifying Storage Schema

**IMPORTANT:** Changing the IndexedDB schema requires careful migration.

```javascript
// In src/utils/db.js

// 1. Increment version
const DB_VERSION = 2; // was 1

// 2. Add migration logic
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  
  // Handle migration from version 1 to 2
  if (oldVersion < 2) {
    // Add new field or index
    const transaction = event.target.transaction;
    const historyStore = transaction.objectStore('history');
    historyStore.createIndex('newField', 'newField', { unique: false });
  }
};
```

### Adding a New Lesson

```javascript
// In src/utils/lessons.js

export const LESSONS = [
  // ... existing lessons
  {
    id: 'new-lesson-id',
    title: 'Lesson Title',
    description: 'Brief description',
    keys: ['a', 's', 'd', 'f'] // Keys to practice
  }
];
```

### Adding a New Component

```javascript
// 1. Create ComponentName.jsx
import React from 'react';
import styles from './ComponentName.module.css';

const ComponentName = ({ prop1, prop2 }) => {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;

// 2. Create ComponentName.module.css
.container {
  /* Scoped styles */
}

// 3. Import and use in parent
import ComponentName from './components/ComponentName';
```

## 🎨 Code Style Guidelines

### React Patterns

```javascript
// ✅ GOOD: Functional component with hooks
const MyComponent = ({ data }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleClick = useCallback(() => {
    // Event handler
  }, [dependencies]);
  
  return <div>...</div>;
};

// ❌ BAD: Class component
class MyComponent extends React.Component {
  // Don't use class components
}
```

### Async Storage Operations

```javascript
// ✅ GOOD: Async/await pattern
const loadData = async () => {
  try {
    const history = await getHistory();
    setHistory(history);
  } catch (error) {
    console.error('Failed to load:', error);
  }
};

// ❌ BAD: Synchronous assumption
const loadData = () => {
  const history = getHistory(); // This won't work!
  setHistory(history);
};
```

### CSS Modules

```javascript
// ✅ GOOD: CSS Modules
import styles from './Component.module.css';
<div className={styles.container}>...</div>

// ❌ BAD: Inline styles for complex styling
<div style={{ padding: '1rem', background: '#fff' }}>...</div>

// ✅ OK: Inline for dynamic values
<div style={{ width: `${progress}%` }}>...</div>
```

## 🔍 Understanding Key Concepts

### IndexedDB Storage

**Why IndexedDB?**
- Permanent storage (survives cache cleanup)
- Large capacity (50MB+)
- Asynchronous (non-blocking)
- Structured data support

**Schema:**
```javascript
TypeFlowDB
├── history (object store)
│   ├── id (auto-increment key)
│   ├── wpm, accuracy, mode, level
│   ├── timestamp (UTC)
│   ├── dateString (local YYYY-MM-DD)
│   └── keyStats (object)
└── replays (object store)
    ├── key (composite: "mode_level")
    ├── wpm
    ├── data (array of timestamps)
    └── timestamp
```

### Date Handling

**Always use local timezone for display:**
```javascript
// ✅ GOOD: Local date string
const dateString = new Date().toLocaleDateString('en-CA'); // "2026-01-04"

// ❌ BAD: UTC date (wrong timezone)
const dateString = new Date().toISOString().split('T')[0];
```

**Store both UTC timestamp and local date:**
```javascript
const entry = {
  timestamp: Date.now(),           // UTC for sorting
  dateString: new Date().toLocaleDateString('en-CA') // Local for grouping
};
```

### WPM Calculation

```javascript
// Words = characters / 5
const wordsTyped = userInput.length / 5;

// Time in minutes
const durationInMinutes = (endTime - startTime) / 60000;

// WPM = words / minutes
const wpm = Math.round(wordsTyped / durationInMinutes);
```

### Accuracy Calculation

```javascript
// Character-by-character comparison
let correctChars = 0;
for (let i = 0; i < userInput.length; i++) {
  if (userInput[i] === text[i]) correctChars++;
}

// Accuracy percentage
const accuracy = Math.round((correctChars / userInput.length) * 100);
```

## 🐛 Common Pitfalls

### 1. Forgetting Async/Await

```javascript
// ❌ WRONG
useEffect(() => {
  const data = getHistory(); // Returns Promise, not data!
  setHistory(data);
}, []);

// ✅ CORRECT
useEffect(() => {
  const loadData = async () => {
    const data = await getHistory();
    setHistory(data);
  };
  loadData();
}, []);
```

### 2. Not Handling Loading States

```javascript
// ❌ WRONG: No loading state
const [stats, setStats] = useState(null);
// Component tries to render stats.wpm before data loads

// ✅ CORRECT: Loading state
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

if (loading) return <div>Loading...</div>;
```

### 3. Inline Functions in JSX

```javascript
// ❌ BAD: Creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: Memoized callback
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);

<button onClick={handleButtonClick}>Click</button>
```

### 4. Missing Dependencies in useEffect

```javascript
// ❌ WRONG: Missing dependencies
useEffect(() => {
  loadData(userId);
}, []); // userId should be in dependencies!

// ✅ CORRECT
useEffect(() => {
  loadData(userId);
}, [userId]);
```

## 📊 Analytics Functions

### Available Analytics

| Function | Returns | Use Case |
|----------|---------|----------|
| `getDailyStats()` | Daily grouped stats | Overview tab, history |
| `getStreak()` | Number | Streak counter |
| `getLessonProgress()` | Object by lesson ID | Lesson stats tab |
| `getAggregateKeyStats()` | Object by key | Key accuracy tab |
| `getWeakKeys()` | Array of keys | Smart drill feature |
| `calculateStatsFromHistory()` | Avg/high WPM, total tests | Summary stats |

### Adding New Analytics

```javascript
// In src/utils/storage.js

export const getNewAnalytic = async () => {
  const history = await getHistory();
  
  // Process history data
  const result = history.reduce((acc, entry) => {
    // Your logic here
    return acc;
  }, initialValue);
  
  return result;
};
```

## 🎯 Best Practices

### 1. Component Design
- **Single Responsibility**: Each component does one thing
- **Props Over State**: Pass data down, events up
- **Composition**: Build complex UIs from simple parts

### 2. State Management
- **Lift State Up**: Share state at lowest common ancestor
- **Local State First**: Only lift when necessary
- **Derived State**: Calculate from existing state, don't duplicate

### 3. Performance
- **Memoization**: Use `useMemo` and `useCallback` appropriately
- **Lazy Loading**: Split code with `React.lazy()` if needed
- **Avoid Re-renders**: Use `React.memo()` for expensive components

### 4. Error Handling
- **Try-Catch**: Wrap async operations
- **Console Errors**: Log errors for debugging
- **User Feedback**: Show error messages to users

### 5. Code Organization
- **Group Related Code**: Keep related files together
- **Clear Naming**: Use descriptive names
- **Comments**: Explain "why", not "what"

## 🔄 Development Workflow

### Making Changes

1. **Understand the requirement**
   - What feature/fix is needed?
   - Which files are affected?
   - What are the edge cases?

2. **Plan the implementation**
   - Which components need changes?
   - Does storage schema need updates?
   - Are there any breaking changes?

3. **Implement incrementally**
   - Make small, focused changes
   - Test after each change
   - Keep commits atomic

4. **Test thoroughly**
   - Manual testing in browser
   - Test all modes (Practice, Lesson, Custom)
   - Test data persistence
   - Check console for errors

5. **Document if needed**
   - Update README for user-facing changes
   - Update this guide for architecture changes
   - Add code comments for complex logic

## 🚀 Quick Start for AI Agents

When asked to work on TypeFlow:

1. **Read the request carefully** - Understand what's being asked
2. **Check relevant files** - View the files you'll modify
3. **Understand the context** - How does this fit in the architecture?
4. **Plan the changes** - What needs to be modified?
5. **Implement carefully** - Follow existing patterns
6. **Test mentally** - Think through edge cases
7. **Provide clear explanations** - Help the user understand your changes

## 📝 Commit Message Guidelines

Follow conventional commits:

```
feat: Add ghost replay feature
fix: Resolve IndexedDB migration issue
docs: Update README with new features
style: Format code with prettier
refactor: Simplify stats calculation
perf: Optimize WPM calculation
test: Add unit tests for generator
chore: Update dependencies
```

## 🆘 When in Doubt

- **Check existing code** - Look for similar patterns
- **Read the architecture** - Understand the system design
- **Ask questions** - Better to clarify than assume
- **Start small** - Make minimal changes first
- **Test thoroughly** - Verify everything works

## 📚 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [IndexedDB API Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Vite Documentation](https://vitejs.dev/)
- [CSS Modules Guide](https://github.com/css-modules/css-modules)

---

**Remember:** TypeFlow is a privacy-focused, client-side application. All data stays in the browser. No server communication. Keep this principle in mind when making changes.
