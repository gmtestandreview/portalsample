import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import { useRouteAccessibility } from '@/hooks/useRouteAccessibility';

function AccessibilityProbe() {
  const { announcement } = useRouteAccessibility();
  const navigate = useNavigate();
  return (
    <>
      <main id='main' tabIndex={-1}>
        Main content
      </main>
      <output aria-label='Route announcement'>{announcement}</output>
      <button type='button' onClick={() => navigate('/next')}>
        Next route
      </button>
    </>
  );
}

const resetAccessibilityTestState = () => {
  vi.useRealTimers();
  vi.useFakeTimers();
  document.title = 'Dashboard';
};

describe('route accessibility behavior', () => {
  it('announces the current title and focuses main content after navigation', async () => {
    expect.hasAssertions();

    resetAccessibilityTestState();

    render(
      <MemoryRouter initialEntries={['/start']}>
        <AccessibilityProbe />
      </MemoryRouter>,
    );

    await act(() => vi.advanceTimersByTimeAsync(100));

    expect(
      screen.getByRole('status', { name: 'Route announcement' }),
    ).toHaveTextContent('Navigated to Dashboard page.');
    expect(screen.getByRole('main')).toHaveFocus();

    document.title = '';
    act(() => {
      screen.getByRole('button', { name: 'Next route' }).click();
    });
    await act(() => vi.advanceTimersByTimeAsync(100));

    expect(
      screen.getByRole('status', { name: 'Route announcement' }),
    ).toHaveTextContent('Navigated to page.');
  });

  it('clears a pending announcement timer on unmount', () => {
    expect.hasAssertions();

    resetAccessibilityTestState();

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(
      <MemoryRouter>
        <AccessibilityProbe />
      </MemoryRouter>,
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.any(Object));
  });
});
