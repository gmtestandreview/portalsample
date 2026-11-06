import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { defined } from '../../../tests/unit/helpers/defined';
import { useRouteAccessibility } from './useRouteAccessibility';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    MemoryRouter,
    { initialEntries: ['/test'] },
    children,
  );
}

const setupRouteAccessibilityTest = () => {
    vi.useFakeTimers();
    document.title = 'Test Page | NMI Portal';
    const main = document.createElement('div');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.appendChild(main);

  return () => {
    vi.useRealTimers();
    main.remove();
  };
};

describe('route accessibility', () => {

  it('returns empty announcement before first route effect fires', () => {
    expect.assertions(1);

    const cleanup = setupRouteAccessibilityTest();
    try {
      const { result } = renderHook(() => useRouteAccessibility(), { wrapper });

      expect(result.current.announcement).toBe('');
    } finally {
      cleanup();
    }
  });

  it('sets announcement to page title after 100 ms debounce on initial path', () => {
    expect.assertions(1);

    const cleanup = setupRouteAccessibilityTest();
    try {
      const { result } = renderHook(() => useRouteAccessibility(), { wrapper });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.announcement).toBe(
        'Navigated to Test Page | NMI Portal page.',
      );
    } finally {
      cleanup();
    }
  });

  it('clears the timeout on unmount', () => {
    expect.assertions(1);

    const cleanup = setupRouteAccessibilityTest();
    try {
      const { unmount } = renderHook(() => useRouteAccessibility(), { wrapper });
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      unmount();

      expect(clearSpy).toHaveBeenCalledWith();
    } finally {
      cleanup();
    }
  });

  it('focuses #main element after debounce fires', () => {
    expect.assertions(1);

    const cleanup = setupRouteAccessibilityTest();
    try {
      const main = defined(document.getElementById('main'), '#main element');
      const focusSpy = vi.spyOn(main, 'focus');
      renderHook(() => useRouteAccessibility(), { wrapper });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(focusSpy).toHaveBeenCalledTimes(1);
    } finally {
      cleanup();
    }
  });
});
