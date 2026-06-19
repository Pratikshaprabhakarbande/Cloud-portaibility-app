import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// Mock fetch for /metrics (globalThis is the standards-compliant cross-env global)
globalThis.fetch = vi.fn(() => new Promise(() => {}));
import Monitoring from './Monitoring.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Monitoring page', () => {
  it('renders the header', () => {
    render(<ThemeProvider><NotificationProvider><AuthProvider><MemoryRouter><Monitoring /></MemoryRouter></AuthProvider></NotificationProvider></ThemeProvider>);
    expect(screen.getByRole('heading', { name: /monitoring center/i })).toBeInTheDocument();
  });
});
