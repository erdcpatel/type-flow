// CommonJS setup file for Vitest (works robustly in CI)
// Do NOT require Vitest here (it cannot be require()-imported). Vitest provides globals when `globals: true`.

// polyfill indexedDB for test environment
require('fake-indexeddb/auto');

// register jest-dom matchers
require('@testing-library/jest-dom');

module.exports = {};
