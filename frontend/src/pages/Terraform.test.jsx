import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/terraform.service.js', () => ({
  default: { run: vi.fn(), history: () => new Promise(() => {}) }
}));

import Terraform from './Terraform.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

function renderPage() {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MemoryRouter>
            <Terraform />
          </MemoryRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

describe('Terraform Center page', () => {
  it('renders the header and a provider action', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /terraform center/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^plan$/i })).toBeInTheDocument();
  });
});
