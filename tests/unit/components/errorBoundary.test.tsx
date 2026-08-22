import { render, screen } from '@testing-library/react';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from '@/types';

const renderErrorDisplay = (status: HttpStatusCode | number) => render(
    <MemoryRouter>
        <ErrorDisplay status={status} />
    </MemoryRouter>,
);

describe('ErrorDisplay', () => {
    afterEach(() => {
        document.body.className = '';
        document.title = '';
    });

    it.each([
        [HttpStatusCode.Conflict, 'Oops - Conflict 409', 'Conflict | NMI Services portal'],
        [HttpStatusCode.Gone, 'Oops - Not Available 410', 'Not Available | NMI Services portal'],
        [HttpStatusCode.NotFound, 'Oops - Page not found 404', 'Page not found | NMI Services portal'],
        [HttpStatusCode.PreconditionFailed, 'Oops - A precondition failed error has occurred 412', 'Precondition Failed | NMI Services portal'],
        [HttpStatusCode.ServiceUnavailable, 'Oops - Service unavailable. 503', 'Service Unavailable | NMI Services portal'],
        [HttpStatusCode.UnprocessableEntity, 'Oops - Unprocessable. 422', 'Unprocessable | NMI Services portal'],
        [HttpStatusCode.Forbidden, 'Oops - Forbidden 403', 'Forbidden | NMI Services portal'],
        [HttpStatusCode.InternalServerError, 'Oops - An unexpected error has occurred', 'Server error | NMI Services portal'],
        [599, 'Oops - An unexpected error has occurred', 'Server error | NMI Services portal'],
    ])('renders the %s error state', (status, heading, title) => {
        renderErrorDisplay(status);

        expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(heading);
        expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'infotm@measurement.gov.au' }))
            .toHaveAttribute('href', 'mailto:infotm@measurement.gov.au?Subject=Error on NMI Services portal');
        expect(document.title).toBe(title);
        expect(document.body).toHaveClass('http-error');
    });
});

describe('ErrorBoundary', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderWithExpectedError = (
        expectedError: Error,
        ui: React.ReactElement,
    ) => {
        const unexpectedConsoleErrors: unknown[][] = [];
        const preventExpectedError = (event: ErrorEvent) => {
            if (event.error === expectedError) {
                event.preventDefault();
            }
        };
        vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
            if (args.includes(expectedError)) {
                return;
            }

            unexpectedConsoleErrors.push(args);
        });
        globalThis.addEventListener('error', preventExpectedError);

        try {
            render(ui);
        } finally {
            globalThis.removeEventListener('error', preventExpectedError);
        }

        expect(unexpectedConsoleErrors).toEqual([]);
    };

    it('renders children when no error is thrown', () => {
        const trackException = vi.fn();
        const appInsights = {
            getAppInsights: () => ({ trackException }),
        };

        render(
            <MemoryRouter>
                <ErrorBoundary appInsights={appInsights as unknown as React.ComponentProps<typeof ErrorBoundary>['appInsights']}>
                    <p>Healthy child</p>
                </ErrorBoundary>
            </MemoryRouter>,
        );

        expect(screen.getByText('Healthy child')).toBeInTheDocument();
        expect(trackException).not.toHaveBeenCalled();
    });

    it('renders the fallback and tracks an exception when a child throws', () => {
        const expectedError = Object.assign(new Error('Request failed'), {
            status: HttpStatusCode.Conflict,
        });
        const ThrowingChild = () => {
            throw expectedError;
        };
        const trackException = vi.fn();
        const appInsights = {
            getAppInsights: () => ({ trackException }),
        };

        renderWithExpectedError(
            expectedError,
            <MemoryRouter>
                <ErrorBoundary appInsights={appInsights as unknown as React.ComponentProps<typeof ErrorBoundary>['appInsights']}>
                    <ThrowingChild />
                </ErrorBoundary>
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { level: 1, name: /Oops - Conflict/i })).toBeInTheDocument();
        expect(trackException).toHaveBeenCalledWith(expect.objectContaining({
            error: expectedError,
            exception: expectedError,
            severityLevel: SeverityLevel.Error,
            properties: expect.objectContaining({
                componentStack: expect.any(String),
            }),
        }));
    });

    it('uses the server-error fallback when a thrown error has no status', () => {
        const expectedError = new Error('Unknown failure');
        const ThrowingChild = () => {
            throw expectedError;
        };
        const appInsights = {
            getAppInsights: () => ({ trackException: vi.fn() }),
        };

        renderWithExpectedError(
            expectedError,
            <MemoryRouter>
                <ErrorBoundary appInsights={appInsights as unknown as React.ComponentProps<typeof ErrorBoundary>['appInsights']}>
                    <ThrowingChild />
                </ErrorBoundary>
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { level: 1, name: /Oops - An unexpected error has occurred/i }))
            .toBeInTheDocument();
    });
});
