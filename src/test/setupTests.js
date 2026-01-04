import { expect } from 'vitest'
global.expect = expect
// polyfill indexedDB for test environment
await import('fake-indexeddb/auto')
await import('@testing-library/jest-dom')
