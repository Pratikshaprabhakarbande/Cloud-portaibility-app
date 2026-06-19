import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock only the default export (axios instance) while preserving all named
// exports (tokenStore, getErrorMessage) so AuthProvider mounts correctly.
vi.mock('../services/api.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: { get: () => new Promise(() => {}), post: () => new Promise(() => {}) }
  };
});

import AdminUsers from './AdminUsers.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

describe('Admin Users page', () => {
  it('renders the header', () => {
    render(
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <MemoryRouter>
              <AdminUsers />
            </MemoryRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    );
    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
  });
});
