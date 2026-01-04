# Copilot instructions for TypeFlow

Purpose: make AI contributors productive quickly by describing the app architecture, developer workflows, and project-specific conventions.

High-level architecture
- Single-page React app built with Vite. Entry: [src/main.jsx](src/main.jsx).
- UI + view components live in [src/components](src/components).
- Core gameplay logic is encapsulated in the hook [src/hooks/useTypingGame.js](src/hooks/useTypingGame.js).
- Text sources and generation: lesson definitions in [src/utils/lessons.js](src/utils/lessons.js) and generator in [src/utils/generator.js](src/utils/generator.js).
- Persistent storage is local-only (IndexedDB) via [src/utils/db.js] and the storage wrapper [src/utils/storage.js](src/utils/storage.js).

Why things are structured this way
- Game logic is kept out of components and inside `useTypingGame` so UIs can remain pure and small; useTypingGame returns `replayData` (an array of millisecond timestamps) used for ghost playback.
- Storage/migrations are centralized in `src/utils/storage.js` to ensure consistent DB init and migration from `localStorage` on first load.

Developer workflows (must-know commands)
- Dev server: `npm run dev` (Vite).
- Build: `npm run build`.
- Lint: `npm run lint` (ESLint configured in repo root).
- Tests: `npm run test` (Vitest with jsdom). CI headless run: `npm run test:ci`.
- Test setup file: [src/test/setupTests.cjs](src/test/setupTests.cjs) — it polyfills IndexedDB (`fake-indexeddb/auto`) and registers `@testing-library/jest-dom`.

Project-specific conventions and patterns
- File layout: `components/`, `hooks/`, `utils/` — follow the same separation when adding features.
- Styling: CSS Modules. Component styles are named `Component.module.css` (see [src/components/TypingArea.module.css](src/components/TypingArea.module.css)).
- Tests live under `src/__tests__/` and are run with Vitest + jsdom. Tests assume fake IndexedDB polyfill is available via the setup file.
- The hook `useTypingGame` exposes: `{ text, userInput, status, handleInput, reset, stats, replayData, ghostIndex }`. `replayData` is an array of timestamps (ms relative to start) saved with results — used by the ghost playback code in the hook and by `TypingArea` via `ghostIndex`.
- Text generation: prefer editing `LESSONS` in [src/utils/lessons.js](src/utils/lessons.js) or the word generator in [src/utils/generator.js](src/utils/generator.js) rather than hardcoding strings in components.
- Storage API: use `saveResult`, `getHistory`, `getBestReplay` from [src/utils/storage.js](src/utils/storage.js) to persist or query results (they handle DB init/migration).

Integration and external dependencies
- No server/back-end: all data stays local (IndexedDB). Avoid adding network calls unless explicitly intended.
- Dev/test dependencies of note: `vite`, `vitest` (jsdom), `@testing-library/react`, `fake-indexeddb` (polyfill tests), ESLint plugins for React.

Common edit locations for typical tasks
- Add/change UI: `src/components` + optional CSS module.
- Change game rules or metrics: `src/hooks/useTypingGame.js` (stats computation and replay collection).
- Add/modify lessons or generation: `src/utils/lessons.js` and `src/utils/generator.js`.
- Storage / migrations: `src/utils/db.js` and `src/utils/storage.js` (handle `initDB`, `migrateFromLocalStorage`).

Testing notes for agents
- Use `npm run test` for iterative local runs; use `npm run test:ci` for CI-like headless runs.
- The environment is jsdom; tests rely on `fake-indexeddb/auto` so test code can assume an IndexedDB-like environment.

Small gotchas
- The app assumes `replayData` is an array of timestamps recorded from `Date.now() - startTime`. Keep that shape when changing replay serialization.
- `useTypingGame` sets `status` to `finished` when `userInput.length === text.length`. If you change text length or input behavior, update finishing logic accordingly.

If anything here is unclear or you want deeper details (DB schema, migration steps, or typical PR examples), tell me which part to expand and I will iterate.
