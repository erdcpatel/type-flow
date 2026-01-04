# TypeFlow - Typing Speed Improver

TypeFlow is a modern, privacy-focused typing speed trainer built with React. It tracks your progress locally using IndexedDB, helps you identify weak keys, and offers structured lessons to improve your touch typing.

## ✨ Features

### 🎯 Multiple Training Modes
- **Practice Mode**: Type against difficulty-based text sets (Basic, Intermediate, Advanced)
- **Structured Lessons**: Progressive lessons starting from home row basics to full keyboard mastery
- **Custom Text Support**: Paste your own text (articles, code, etc.) to practice specific content
- **Sudden Death Mode**: One mistake ends the game - perfect for accuracy training

### 📊 Advanced Analytics
- **Real-time Metrics**: Live WPM and accuracy tracking
- **Persistent History**: All data stored permanently in IndexedDB
- **Daily Streaks**: Track your consistency with streak counters
- **Per-Lesson Progress**: Attempts, best WPM, and average accuracy for each lesson
- **Key-Level Analytics**: Visual breakdown showing accuracy for every key
- **Smart Key Drills**: Automatically identifies your weakest keys and generates custom practice

### 🎮 Interactive Features
- **Ghost Replay**: Race against your personal best performance
- **Progress Tracking**: Day-to-day progress with local timezone support
- **Reset Functionality**: Clear all stats to start fresh anytime

### 🔒 Privacy First
All data is stored **locally in your browser** using IndexedDB. No signup required, no data sent to servers, complete privacy.

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS Modules with glassmorphism aesthetic
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: IndexedDB for permanent local storage
- **Date Handling**: Local timezone support with proper date grouping

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/erdcpatel/type-flow.git
   cd type-flow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 📁 Project Structure

```
type-flow/
├── src/
│   ├── components/          # React components
│   │   ├── TypingArea.jsx   # Main typing interface
│   │   ├── StatsModal.jsx   # Statistics and analytics
│   │   ├── ResultCard.jsx   # Test completion results
│   │   └── LessonSelector.jsx
│   ├── hooks/               # Custom React hooks
│   │   └── useTypingGame.js # Core typing game logic
│   ├── utils/               # Utility functions
│   │   ├── db.js           # IndexedDB wrapper
│   │   ├── storage.js      # Storage operations
│   │   ├── generator.js    # Text generation
│   │   ├── lessons.js      # Lesson definitions
│   │   └── texts.js        # Practice texts
│   ├── App.jsx             # Main application
│   └── main.jsx            # Entry point
├── public/                  # Static assets
├── docs/                    # Additional documentation
└── package.json
```

## 💾 Data Storage

TypeFlow uses **IndexedDB** for permanent local storage:

- **Database**: `TypeFlowDB`
- **Object Stores**: 
  - `history` - All typing test results with timestamps
  - `replays` - Best performance replays for ghost mode

### Data Persistence

- Data survives browser restarts and cache cleanup
- Automatic migration from old localStorage data
- Local timezone support for accurate date tracking
- Reset functionality available in stats modal

## 🎓 How to Use

1. **Choose a Mode**: Practice, Lesson, or Custom
2. **Start Typing**: Click the input area and begin
3. **View Stats**: Click "view detailed stats" to see your progress
4. **Track Progress**: Check your daily streak and improvement over time
5. **Practice Weak Keys**: Use the smart drill feature to target problem areas

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- Code style guidelines
- Development workflow
- How to submit pull requests
- Project architecture

## 📚 Additional Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and architecture
- [AI_AGENT_GUIDE.md](docs/AI_AGENT_GUIDE.md) - Guide for AI agents working on this project
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

## 🐛 Troubleshooting

### Data Not Persisting
- Ensure your browser supports IndexedDB
- Check browser console for errors
- Try resetting stats and starting fresh

### Performance Issues
- Clear browser cache
- Disable browser extensions
- Check for console errors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for an optimal typing training experience.
