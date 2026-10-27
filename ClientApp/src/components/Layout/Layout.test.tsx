import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect } from 'vitest';
import Layout from './index';

describe('layout AppShell — WCAG accessibility', () => {
  it('renders an aria-live polite region', () => {
    expect.assertions(2);

    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );
    const region = screen.getByRole('status');

    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveClass('visually-hidden');
  });

  it('renders exactly one role=status region (no duplicate from old component)', () => {
    expect.assertions(1);

    render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('populates the announcement after navigation', () => {
    expect.assertions(1);

    vi.useFakeTimers();
    document.title = 'Dashboard | NMI Portal';
    try {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Layout>
            <div>content</div>
          </Layout>
        </MemoryRouter>,
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByRole('status').textContent).toBe(
        'Navigated to Dashboard | NMI Portal page.',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
