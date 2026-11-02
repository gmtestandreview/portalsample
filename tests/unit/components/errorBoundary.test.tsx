import { render, screen } from '@testing-library/react';
import { SeverityLevel } from '@microsoft/applicationinsights-common';
import type { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorBoundary/ErrorDisplay';
import { HttpStatusCode } from '@/types';

type TrackException = ReturnType<
  ReactPlugin['getAppInsights']
>['trackException'];

const renderErrorDisplay = (status: HttpStatusCode | number) =>
  render(
    <MemoryRouter>
      <ErrorDisplay status={status} />
    </MemoryRouter>,
  );

const resetErrorBoundaryTest = () => {
  vi.restoreAllMocks();
  document.body.className = '';
  document.title = '';
};

describe('error display', () => {
  it.each([
    [
      HttpStatusCode.Conflict,
      'Oops - Conflict 409',
      'Conflict | NMI Services portal',
    ],
    [
      HttpStatusCode.Gone,
      'Oops - Not Available 410',
      'Not Available | NMI Services portal',
    ],
    [
      HttpStatusCode.NotFound,
      'Oops - Page not found 404',
      'Page not found | NMI Services portal',
    ],
    [
      HttpStatusCode.PreconditionFailed,
      'Oops - A precondition failed error has occurred 412',
      'Precondition Failed | NMI Services portal',
    ],
    [
      HttpStatusCode.ServiceUnavailable,
      'Oops - Service unavailable. 503',
      'Service Unavailable | NMI Services portal',
    ],
    [
      HttpStatusCode.UnprocessableEntity,
      'Oops - Unprocessable. 422',
      'Unprocessable | NMI Services portal',
    ],
    [
      HttpStatusCode.Forbidden,
      'Oops - Forbidden 403',
      'Forbidden | NMI Services portal',
    ],
    [
      HttpStatusCode.InternalServerError,
      'Oops - An unexpected error has occurred',
      'Server error | NMI Services portal',
    ],
    [
      599,
      'Oops - An unexpected error has occurred',
      'Server error | NMI Services portal',
    ],
  ])('renders the %s error state', (status, heading, title) => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    renderErrorDisplay(status);

    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      heading,
    );
    expect(
      screen.getByRole('link', { name: 'Go to dashboard' }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('link', { name: 'infotm@measurement.gov.au' }),
    ).toHaveAttribute(
      'href',
      'mailto:infotm@measurement.gov.au?Subject=Error on NMI Services portal',
    );
    expect(document.title).toBe(title);
    expect(document.body).toHaveClass('http-error');
  });
});

describe('error boundary', () => {
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

    expect(unexpectedConsoleErrors).toStrictEqual([]);
  };

  it('renders children when no error is thrown', () => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    const trackException = vi.fn<TrackException>();
    const appInsights = {
      getAppInsights: () => ({ trackException }),
    };

    render(
      <MemoryRouter>
        <ErrorBoundary
          appInsights={
            appInsights as unknown as React.ComponentProps<
              typeof ErrorBoundary
            >['appInsights']
          }
        >
          <p>Healthy child</p>
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText('Healthy child')).toBeInTheDocument();
    expect(trackException).not.toHaveBeenCalled();
  });

  it('renders the fallback when telemetry is disabled', () => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    const expectedError = Object.assign(new Error('Request failed'), {
      status: HttpStatusCode.Conflict,
    });
    const ThrowingChild = () => {
      throw expectedError;
    };

    // createTelemetryService hands back a null reactPlugin whenever the App
    // Insights connection string is missing or dummy - every environment
    // without telemetry configured. The boundary is the last line of
    // defence, so it has to render its fallback rather than throw from
    // inside its own error handler.
    renderWithExpectedError(
      expectedError,
      <MemoryRouter>
        <ErrorBoundary appInsights={null}>
          <ThrowingChild />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Oops - Conflict 409',
    );
  });

  it('renders the fallback and tracks an exception when a child throws', () => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    const expectedError = Object.assign(new Error('Request failed'), {
      status: HttpStatusCode.Conflict,
    });
    const ThrowingChild = () => {
      throw expectedError;
    };
    const trackException = vi.fn<TrackException>();
    const appInsights = {
      getAppInsights: () => ({ trackException }),
    };

    renderWithExpectedError(
      expectedError,
      <MemoryRouter>
        <ErrorBoundary
          appInsights={
            appInsights as unknown as React.ComponentProps<
              typeof ErrorBoundary
            >['appInsights']
          }
        >
          <ThrowingChild />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /Oops - Conflict/i }),
    ).toBeInTheDocument();
    expect(trackException).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expectedError,
        exception: expectedError,
        severityLevel: SeverityLevel.Error,
      }),
    );
    expect(
      trackException.mock.calls[0]?.[0]?.properties?.['componentStack'],
    ).toStrictEqual(expect.any(String));
  });

  it('uses the server-error fallback when a thrown error has no status', () => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    const expectedError = new Error('Unknown failure');
    const ThrowingChild = () => {
      throw expectedError;
    };
    const appInsights = {
      getAppInsights: () => ({ trackException: vi.fn<TrackException>() }),
    };

    renderWithExpectedError(
      expectedError,
      <MemoryRouter>
        <ErrorBoundary
          appInsights={
            appInsights as unknown as React.ComponentProps<
              typeof ErrorBoundary
            >['appInsights']
          }
        >
          <ThrowingChild />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Oops - An unexpected error has occurred/i,
      }),
    ).toBeInTheDocument();
  });

  it('wraps a non-Error throw into an Error before tracking it', () => {
    expect.hasAssertions();

    resetErrorBoundaryTest();

    const thrown = 'plain string failure';
    const throwUnknown = (value: unknown): never => {
      // The runtime value deliberately remains a string; the assertion only
      // satisfies TypeScript for this non-Error throw fixture.
      throw value as Error;
    };
    const ThrowingChild = () => {
      return throwUnknown(thrown);
    };
    const trackException = vi.fn<TrackException>();
    const appInsights = {
      getAppInsights: () => ({ trackException }),
    };

    // React logs its own error for the deliberate failure; suppress it so the
    // test only asserts the normalisation.
    const preventError = (event: ErrorEvent) => {
      event.preventDefault();
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.addEventListener('error', preventError);

    try {
      render(
        <MemoryRouter>
          <ErrorBoundary
            appInsights={
              appInsights as unknown as React.ComponentProps<
                typeof ErrorBoundary
              >['appInsights']
            }
          >
            <ThrowingChild />
          </ErrorBoundary>
        </MemoryRouter>,
      );
    } finally {
      globalThis.removeEventListener('error', preventError);
    }

    const [trackedException] = trackException.mock.calls[0] as [
      { error: Error; exception: Error; severityLevel: SeverityLevel },
    ];

    expect(trackedException.error).toBeInstanceOf(Error);
    expect(trackedException.exception).toBe(trackedException.error);
    expect(trackedException.error.message).toBe('plain string failure');
    expect(trackedException.severityLevel).toBe(SeverityLevel.Error);
  });
});
