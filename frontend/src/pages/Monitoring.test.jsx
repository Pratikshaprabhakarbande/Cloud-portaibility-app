import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useApi so the component renders immediately with sample metric data,
// avoiding any fetch/api.js/axios dependency.
vi.mock('../hooks/useApi.js', () => ({
  default: () => ({
    data: { healthScore: 90, securityScore: 80, activeDeployments: 5, containers: 3, monthlyCost: 100, openIncidents: 0, heapUsed: 50000000, eventLoopLag: 0.01, httpRequests: 200, httpErrors: 0 },
    loading: false,
    error: null,
    refetch: vi.fn()
  })
}));

import Monitoring from './Monitoring.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Monitoring page', () => {
  it('renders the header', () => {
    render(
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <MemoryRouter>
              <Monitoring />
            </MemoryRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    );
    expect(screen.getByRole('heading', { name: /monitoring center/i })).toBeInTheDocument();
  });
});
