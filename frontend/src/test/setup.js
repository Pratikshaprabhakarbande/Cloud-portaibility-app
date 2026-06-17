/**
 * Vitest setup: jest-dom matchers + jsdom polyfills + RTL cleanup.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// With `globals: false`, React Testing Library cannot auto-register cleanup,
// so we do it explicitly. Without this, renders from earlier `it` blocks leak
// into later ones (e.g. duplicate "AWS" buttons in the Dashboard test).
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia, which ThemeContext relies on.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })
});
