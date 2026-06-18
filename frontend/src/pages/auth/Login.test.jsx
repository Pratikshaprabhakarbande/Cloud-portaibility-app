import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';
import { ThemeProvider } from '../../context/ThemeContext.jsx';
import { NotificationProvider } from '../../context/NotificationContext.jsx';
import { AuthProvider } from '../../context/AuthContext.jsx';

function renderLogin() {
  return render(
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Login />
          </MemoryRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

describe('Login page', () => {
  it('renders the sign-in heading and email field', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows the register link', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });
});
