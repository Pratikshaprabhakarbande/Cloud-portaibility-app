import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Keep the dashboard in its loading state (pending promises) so the header and
// provider switcher render without needing chart data or the network.
vi.mock('../services/dashboard.service.js', () => ({
  default: {
    getOverview: () => new Promise(() => {}),
    getCharts: () => new Promise(() => {})
  }
}));

import Dashboard from './Dashboard.jsx';

describe('Dashboard page', () => {
  it('renders the dashboard header', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { name: /multi-cloud dashboard/i })).toBeInTheDocument();
  });

  it('renders the provider switcher (AWS option)', () => {
    render(<Dashboard />);
    expect(screen.getByRole('button', { name: /^aws$/i })).toBeInTheDocument();
  });
});
