# TypeFlow Architecture

## System Overview

TypeFlow is a client-side typing speed trainer built with React and Vite. All data is stored locally in the browser using IndexedDB, ensuring complete privacy and offline functionality.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React Application                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   App.jsx    │  │  Components  │  │    Hooks    │ │  │
│  │  │              │  │              │  │             │ │  │
│  │  │ - Mode State │  │ - TypingArea │  │ - useTyping │ │  │
│  │  │ - History    │  │ - StatsModal │  │   Game      │ │  │
│  │  │ - Replays    │  │ - ResultCard │  │             │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │  │
│  │         │                 │                  │        │  │
│  │         └─────────────────┴──────────────────┘        │  │
│  │                           │                           │  │
│  │  ┌────────────────────────┴─────────────────────────┐ │  │
│  │  │              Utils Layer                         │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │ │  │
│  │  │  │ storage  │  │    db    │  │   generator   │ │ │  │
│  │  │  │          │  │          │  │               │ │ │  │
│  │  │  │ Analytics│  │ IndexedDB│  │ Text Creation │ │ │  │
│  │  │  └────┬─────┘  └────┬─────┘  └───────────────┘ │ │  │
│  │  └───────┼─────────────┼──────────────────────────┘ │  │
│  └──────────┼─────────────┼────────────────────────────┘  │
│             │             │                                │
│  ┌──────────┴─────────────┴──────────────────────────────┐ │
│  │                    IndexedDB                           │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │ │
│  │  │  TypeFlowDB      │  │                          │  │ │
│  │  │  ├─ history      │  │  - Permanent Storage     │  │ │
│  │  │  └─ replays      │  │  - Survives Cache Clear  │  │ │
│  │  └──────────────────┘  └──────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Application Layer (`App.jsx`)

**Responsibilities:**
- Mode management (Practice, Lesson, Custom)
- Global state coordination
- History and replay state
- Event handling and routing between components

**Key State:**
- `mode` - Current typing mode
- `level` - Difficulty level for practice mode
- `currentLessonId` - Active lesson ID
- `history` - All typing test results
- `ghostReplay` - Best performance data for ghost mode
- `suddenDeath` - Game mode flag

### 2. Custom Hooks

#### `useTypingGame` (`hooks/useTypingGame.js`)

**Purpose:** Core typing game logic and state management

**Inputs:**
- `initialText` - Text to type
- `suddenDeath` - Boolean for sudden death mode
- `ghostReplay` - Array of timestamps for ghost mode

**Outputs:**
- `text` - Current text to type
- `userInput` - User's typed input
- `status` - Game status (idle, running, finished, failed)
- `stats` - Current WPM and accuracy
- `replayData` - Timestamps for current session
- `ghostIndex` - Current ghost position
- `handleInput` - Input handler function
- `reset` - Reset function

**Key Features:**
- Real-time WPM calculation
- Per-key accuracy tracking
- Ghost replay animation
- Sudden death failure detection

### 3. Storage Layer

#### IndexedDB Wrapper (`utils/db.js`)

**Database Schema:**
```javascript
Database: TypeFlowDB (version 1)

ObjectStore: history
  - keyPath: id (auto-increment)
  - indexes: dateString, timestamp, mode
  - fields: {
      id, wpm, accuracy, mode, level,
      keyStats, timestamp, dateString
    }

ObjectStore: replays
  - keyPath: key (composite: "mode_level")
  - fields: { key, wpm, data, timestamp }
```

**Key Functions:**
- `initDB()` - Initialize database connection
- `saveHistoryEntry()` - Save typing result
- `getAllHistory()` - Retrieve all history
- `saveReplay()` - Save best replay
- `getBestReplay()` - Get replay for mode/level
- `clearAllData()` - Reset all data
- `migrateFromLocalStorage()` - One-time migration

#### Storage Operations (`utils/storage.js`)

**Responsibilities:**
- High-level storage API
- Analytics calculations
- Data aggregation

**Key Functions:**
- `saveResult()` - Save with replay handling
- `getHistory()` - Get all results
- `getDailyStats()` - Group by date
- `getStreak()` - Calculate daily streak
- `getLessonProgress()` - Per-lesson stats
- `getAggregateKeyStats()` - Key accuracy data
- `getWeakKeys()` - Identify problem keys
- `resetAllData()` - Clear everything

### 4. UI Components

#### `TypingArea` (`components/TypingArea.jsx`)
- Displays text with character-by-character highlighting
- Shows correct (green), incorrect (red), and ghost (blue) characters
- Handles user input

#### `StatsModal` (`components/StatsModal.jsx`)
- Three tabs: Overview, Lessons, Keys
- Displays daily stats, streaks, and history
- Shows per-lesson progress
- Key accuracy visualization
- Reset functionality

#### `ResultCard` (`components/ResultCard.jsx`)
- Shows test completion results
- Displays WPM, accuracy, and comparison to history
- Provides restart option

#### `LessonSelector` (`components/LessonSelector.jsx`)
- Grid of available lessons
- Shows lesson progress and attempts
- Lesson selection interface

### 5. Utilities

#### Text Generator (`utils/generator.js`)
- `generateLessonText()` - Creates random text from key set
- Ensures proper spacing and word formation
- Configurable length

#### Lessons (`utils/lessons.js`)
- Lesson definitions with progressive difficulty
- Home row → Top row → Bottom row → Numbers → Symbols
- Each lesson has ID, title, description, and key set

#### Practice Texts (`utils/texts.js`)
- Predefined texts for difficulty levels
- Basic, Intermediate, Advanced

## Data Flow

### Typing Test Flow

```
1. User selects mode/lesson
   ↓
2. App generates/selects text
   ↓
3. useTypingGame initializes with text
   ↓
4. User types → handleInput()
   ↓
5. Real-time stats calculation
   ↓
6. Test completion detected
   ↓
7. saveResult() to IndexedDB
   ↓
8. Update history state
   ↓
9. Check for new personal best
   ↓
10. Update ghost replay if PB
```

### Stats Display Flow

```
1. User clicks "view detailed stats"
   ↓
2. StatsModal mounts
   ↓
3. useEffect loads data:
   - getDailyStats()
   - getStreak()
   - getLessonProgress()
   - getAggregateKeyStats()
   ↓
4. Display in tabs
   ↓
5. User can reset → resetAllData()
```

## State Management

### Global State (App.jsx)
- Mode and configuration
- History array
- Ghost replay data

### Local State (Components)
- UI state (modals, tabs)
- Form inputs
- Loading states

### Hook State (useTypingGame)
- Game state (text, input, status)
- Performance metrics
- Replay tracking

## Performance Considerations

### Optimizations
- `useCallback` for event handlers
- `useMemo` for expensive calculations
- CSS Modules for scoped styles
- Vite for fast builds and HMR

### IndexedDB Benefits
- Asynchronous operations (non-blocking)
- Indexed queries for fast lookups
- Large storage capacity (50MB+)
- Permanent persistence

## Security & Privacy

### Data Privacy
- **100% client-side** - No server communication
- **Local storage only** - Data never leaves browser
- **No tracking** - No analytics or telemetry
- **No accounts** - No user identification

### Data Integrity
- IndexedDB transactions ensure ACID properties
- Automatic migration handles schema changes
- Reset functionality for data cleanup

## Browser Compatibility

### Requirements
- Modern browser with ES6+ support
- IndexedDB support (all modern browsers)
- CSS Grid and Flexbox support

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Architecture Considerations

### Potential Enhancements
1. **Web Workers** - Offload heavy calculations
2. **Service Workers** - Offline support, PWA
3. **Export/Import** - Data portability
4. **Cloud Sync** - Optional account-based sync
5. **Testing Framework** - Automated tests
6. **TypeScript** - Type safety
7. **State Management Library** - For complex state (Redux, Zustand)

## Development Workflow

### Local Development
```bash
npm run dev     # Start dev server with HMR
npm run build   # Production build
npm run preview # Preview production build
```

### Code Organization Principles
- **Separation of Concerns** - UI, logic, data separate
- **Single Responsibility** - Each module has one job
- **DRY** - Reusable utilities and components
- **Composition** - Build complex UIs from simple parts

## Testing Strategy

### Current Approach
- Manual testing in browser
- Visual verification
- Console error monitoring

### Recommended Future Testing
- **Unit Tests** - Vitest for utilities and hooks
- **Component Tests** - React Testing Library
- **E2E Tests** - Playwright or Cypress
- **Performance Tests** - Lighthouse CI
