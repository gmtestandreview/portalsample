import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouteAccessibility } from './useRouteAccessibility';

function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(MemoryRouter, { initialEntries: ['/test'] }, children);
}

describe('useRouteAccessibility', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.title = 'Test Page | NMI Portal';
        const main = document.createElement('div');
        main.id = 'main';
        main.tabIndex = -1;
        document.body.appendChild(main);
    });

    afterEach(() => {
        vi.useRealTimers();
        document.getElementById('main')?.remove();
    });

    it('returns empty announcement before first route effect fires', () => {
        const { result } = renderHook(() => useRouteAccessibility(), { wrapper });
        expect(result.current.announcement).toBe('');
    });

    it('sets announcement to page title after 100 ms debounce on initial path', () => {
        const { result } = renderHook(() => useRouteAccessibility(), { wrapper });
        act(() => { vi.advanceTimersByTime(100); });
        expect(result.current.announcement).toBe('Navigated to Test Page | NMI Portal page.');
    });

    it('clears the timeout on unmount', () => {
        const { unmount } = renderHook(() => useRouteAccessibility(), { wrapper });
        const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
        unmount();
        expect(clearSpy).toHaveBeenCalled();
    });

    it('focuses #main element after debounce fires', () => {
        const main = document.getElementById('main')!;
        const focusSpy = vi.spyOn(main, 'focus');
        renderHook(() => useRouteAccessibility(), { wrapper });
        act(() => { vi.advanceTimersByTime(100); });
        expect(focusSpy).toHaveBeenCalledTimes(1);
    });
});
