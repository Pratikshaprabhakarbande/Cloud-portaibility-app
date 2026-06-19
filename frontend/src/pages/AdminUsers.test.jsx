import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useApi so the component renders its heading immediately (loading=false,
// data=[]) without calling api.js at all. This avoids any tokenStore/axios issue.
vi.mock('../hooks/useApi.js', () => ({
  default: () => ({ data: [], loading: false, error: null, refetch: vi.fn() })
}));

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
