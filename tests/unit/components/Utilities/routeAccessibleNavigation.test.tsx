import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import RouteAccessibleNavigation from '@/components/Utilities/routeAccessibleNavigation';

const resetRouteAccessibleNavigation = () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.useFakeTimers();
  document.title = 'Dashboard';
};

describe('route accessible navigation', () => {
  it('announces a non-root route after the navigation delay and clears the pending timer on unmount', () => {
    expect.hasAssertions();

    resetRouteAccessibleNavigation();

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    try {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <RouteAccessibleNavigation />
        </MemoryRouter>,
      );

      expect(screen.getByRole('status')).toHaveTextContent('Dashboard');

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByRole('status')).toHaveTextContent(
        'Navigated to Dashboard page.',
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.any(Object));
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('announces the root route immediately with the current document title', () => {
    expect.hasAssertions();

    resetRouteAccessibleNavigation();

    try {
      render(
        <MemoryRouter initialEntries={['/']}>
          <RouteAccessibleNavigation />
        </MemoryRouter>,
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        'Navigated to Dashboard page.',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('announces the root route when document title is empty without scheduling a timer', () => {
    expect.hasAssertions();

    resetRouteAccessibleNavigation();

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    document.title = '';

    try {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/']}>
          <RouteAccessibleNavigation />
        </MemoryRouter>,
      );

      expect(screen.getByRole('status').textContent).toBe(
        'Navigated to  page.',
      );

      unmount();

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
