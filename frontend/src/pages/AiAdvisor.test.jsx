import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/ai.service.js', () => ({
  default: { generate: vi.fn(), recommendations: () => new Promise(() => {}) }
}));

import AiAdvisor from './AiAdvisor.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

function renderPage() {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MemoryRouter>
            <AiAdvisor />
          </MemoryRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

describe('AI Cloud Advisor page', () => {
  it('renders the header and Generate button', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /ai cloud advisor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });
});
