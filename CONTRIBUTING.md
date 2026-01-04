# Contributing to TypeFlow

First off, thanks for taking the time to contribute! 🎉

TypeFlow is an open-source project and we love receiving contributions from our community — you! There are many ways to contribute, from writing tutorials or blog posts, improving the documentation, submitting bug reports and feature requests, or writing code which can be incorporated into TypeFlow itself.

## 🛠️ How to Contribute

### 1. Fork and Clone

Fork the repo on GitHub and clone it to your local machine.

```bash
git clone https://github.com/YOUR-USERNAME/type-flow.git
cd type-flow
npm install
```

### 2. Create a Branch

Create a new branch for your feature or bug fix.

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/annoying-bug
```

### 3. Make Changes

Make your changes in code. Ensure you follow the existing coding style:

#### Code Style Guidelines

- **Use Functional Components and Hooks** - No class components
- **Use CSS Modules** for styling - Keeps styles scoped and maintainable
- **Keep components small and focused** - Single responsibility principle
- **Use meaningful variable names** - Code should be self-documenting
- **Add comments for complex logic** - Help future contributors understand your code
- **Follow React best practices**:
  - Use `useCallback` for functions passed as props
  - Use `useMemo` for expensive computations
  - Avoid inline function definitions in JSX when possible

#### File Organization

- Place new components in `src/components/`
- Place custom hooks in `src/hooks/`
- Place utility functions in `src/utils/`
- Create CSS modules alongside components (e.g., `Component.jsx` + `Component.module.css`)

### 4. Test Your Changes

Since we currently rely on manual verification, please verify:

- **The app builds**: `npm run build`
- **No console errors** occur during usage
- **Your new feature works as expected** across different modes (Practice, Lesson, Custom)
- **Existing features still work** - Regression testing
- **Test on different browsers** if possible (Chrome, Firefox, Safari)

### 5. Commit and Push

Commit your changes with a clear, descriptive message following conventional commits:

```bash
git commit -m "feat: Add ghost replay feature"
git commit -m "fix: Resolve IndexedDB migration issue"
git commit -m "docs: Update README with new features"
```

**Commit Message Prefixes:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

```bash
git push origin feature/amazing-feature
```

### 6. Submit a Pull Request

Go to the original repository and submit a Pull Request. Provide a clear description including:

- **What** you changed
- **Why** you made the change
- **How** to test it
- Screenshots or GIFs if applicable (especially for UI changes)

## 🐛 Reporting Bugs

If you find a bug, please create an issue including:

- **Clear title** describing the bug
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots or error messages** if applicable
- **Browser and OS** information
- **Console errors** if any

**Example:**
```
Title: Stats modal doesn't load on Firefox

Steps to reproduce:
1. Complete a typing test
2. Click "view detailed stats"
3. Modal appears but shows "Loading stats..." indefinitely

Expected: Stats should load and display
Actual: Stuck on loading screen

Browser: Firefox 120.0
OS: macOS 14.0
Console error: [Error message here]
```

## 💡 Feature Requests

Have an idea? Create an issue with the "enhancement" label and describe:

- **What** feature you'd like to see
- **Why** it would be useful
- **How** it might work (optional)
- **Examples** from other apps (optional)

## 📋 Development Workflow

### Setting Up Your Environment

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open browser at `http://localhost:5173`
4. Make changes and see them hot-reload

### Understanding the Codebase

- **`App.jsx`** - Main application logic, mode switching, state management
- **`useTypingGame.js`** - Core typing game hook with WPM/accuracy calculations
- **`db.js`** - IndexedDB wrapper for permanent storage
- **`storage.js`** - Storage operations and analytics functions
- **`StatsModal.jsx`** - Statistics display and reset functionality

### Common Tasks

#### Adding a New Lesson

1. Edit `src/utils/lessons.js`
2. Add a new lesson object with `id`, `title`, `description`, and `keys`
3. Test in Lesson mode

#### Modifying Storage Schema

1. Update `src/utils/db.js`
2. Increment `DB_VERSION` constant
3. Add migration logic in `onupgradeneeded`
4. Test migration from old version

#### Adding a New Component

1. Create `ComponentName.jsx` in `src/components/`
2. Create `ComponentName.module.css` for styles
3. Import and use in parent component
4. Test rendering and functionality

## 🎨 Design Guidelines

- **Follow the glassmorphism aesthetic** - Use `var(--glass-bg)`, `var(--glass-border)`
- **Use CSS variables** for colors - Defined in `index.css`
- **Maintain responsive design** - Test on different screen sizes
- **Ensure accessibility** - Use semantic HTML, proper ARIA labels
- **Keep animations smooth** - Use CSS transitions, avoid janky animations

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [CSS Modules](https://github.com/css-modules/css-modules)

## ❓ Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Comment on an existing issue
- Reach out to maintainers

Thank you for contributing to TypeFlow! 🚀
