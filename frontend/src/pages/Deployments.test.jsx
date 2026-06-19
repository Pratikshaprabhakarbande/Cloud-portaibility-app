import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('../services/dashboard.service.js', () => ({ default: { listDeployments: () => new Promise(() => {}), getDeploymentStats: () => new Promise(() => {}), getDeploymentTrends: () => new Promise(() => {}) } }));
import Deployments from './Deployments.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Deployments page', () => {
  it('renders the header', () => {
    render(<ThemeProvider><NotificationProvider><AuthProvider><MemoryRouter><Deployments /></MemoryRouter></AuthProvider></NotificationProvider></ThemeProvider>);
    expect(screen.getByRole('heading', { name: /deployments/i })).toBeInTheDocument();
  });
});
