import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('../services/dashboard.service.js', () => ({ default: { getOverview: () => new Promise(() => {}) } }));
import Kubernetes from './Kubernetes.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Kubernetes page', () => {
  it('renders the header', () => {
    render(<ThemeProvider><NotificationProvider><AuthProvider><MemoryRouter><Kubernetes /></MemoryRouter></AuthProvider></NotificationProvider></ThemeProvider>);
    expect(screen.getByRole('heading', { name: /kubernetes management/i })).toBeInTheDocument();
  });
});
