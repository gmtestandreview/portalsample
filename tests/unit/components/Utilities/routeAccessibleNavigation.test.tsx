import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RouteAccessibleNavigation from '@/components/Utilities/routeAccessibleNavigation';

describe('RouteAccessibleNavigation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.title = 'Dashboard';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('announces a non-root route after the navigation delay and clears the pending timer on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

        const { unmount } = render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <RouteAccessibleNavigation />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status')).toHaveTextContent('Dashboard');

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(screen.getByRole('status')).toHaveTextContent('Navigated to Dashboard page.');

        unmount();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('announces the root route immediately with the current document title', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <RouteAccessibleNavigation />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status')).toHaveTextContent('Navigated to Dashboard page.');
    });

    it('announces the root route when document title is empty without scheduling a timer', () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
        document.title = '';

        const { unmount } = render(
            <MemoryRouter initialEntries={['/']}>
                <RouteAccessibleNavigation />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status').textContent).toBe('Navigated to  page.');

        unmount();
        expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });
});
