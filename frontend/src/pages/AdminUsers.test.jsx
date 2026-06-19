import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('../services/api.js', () => ({ default: { get: () => new Promise(() => {}) }, getErrorMessage: () => 'err' }));
import AdminUsers from './AdminUsers.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Admin Users page', () => {
  it('renders the header', () => {
    render(<ThemeProvider><NotificationProvider><AuthProvider><MemoryRouter><AdminUsers /></MemoryRouter></AuthProvider></NotificationProvider></ThemeProvider>);
    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
  });
});
