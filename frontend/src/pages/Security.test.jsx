import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/security.service.js', () => ({
  default: {
    overview: () => new Promise(() => {}),
    failedLogins: () => Promise.resolve(null)
  }
}));

import Security from './Security.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

function renderPage() {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MemoryRouter>
            <Security />
          </MemoryRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

describe('Security Center page', () => {
  it('renders the header', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /security center/i })).toBeInTheDocument();
  });
});
