import type { ComponentType, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Conflict from '@/frameworkRoutes/errors/conflict';
import Forbidden from '@/frameworkRoutes/errors/forbidden';
import NoLongerAvailable from '@/frameworkRoutes/errors/noLongerAvailable';
import NotFound from '@/frameworkRoutes/errors/notFound';
import NotFoundCatchall from '@/frameworkRoutes/errors/notFoundCatchall';
import PreconditionFailed from '@/frameworkRoutes/errors/preconditionFailed';
import ServerError from '@/frameworkRoutes/errors/serverError';
import ServiceUnavailable from '@/frameworkRoutes/errors/serviceUnavailable';
import Unprocessable from '@/frameworkRoutes/errors/unprocessable';
import {
  createAuthenticatedErrorRoute,
  createPreconditionErrorRoute,
} from '@/frameworkRoutes/errors/errorRoute';
import { HttpStatusCode } from '@/types';

vi.mock(
  import('@/components/ErrorBoundary/ErrorDisplay'),
  () =>
    ({
      default: ({ status }: { status: number }) => (
        <div data-testid='error-display' data-status={status} />
      ),
    }) satisfies __ExactMockModule<__TestMockModule177>,
);

vi.mock(
  import('@/routes/preConditions/PreConditions'),
  () =>
    ({
      default: ({
        children,
        displayHeaderAndFooter,
      }: {
        children: ReactNode;
        displayHeaderAndFooter?: boolean;
      }) => (
        <div
          data-testid='pre-conditions'
          data-header-and-footer={String(displayHeaderAndFooter)}
        >
          {children}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule12>,
);

describe('framework error routes', () => {
  it.each([
    ['conflict', Conflict, HttpStatusCode.Conflict],
    ['forbidden', Forbidden, HttpStatusCode.Forbidden],
    ['noLongerAvailable', NoLongerAvailable, HttpStatusCode.Gone],
    [
      'preconditionFailed',
      PreconditionFailed,
      HttpStatusCode.PreconditionFailed,
    ],
    [
      'serviceUnavailable',
      ServiceUnavailable,
      HttpStatusCode.ServiceUnavailable,
    ],
    ['unprocessable', Unprocessable, HttpStatusCode.UnprocessableEntity],
  ] satisfies [string, ComponentType, number][])(
    'renders the %s route as an error display without page preconditions',
    (_name, Route, status) => {
      expect.hasAssertions();

      render(<Route />);

      expect(screen.getByTestId('error-display')).toHaveAttribute(
        'data-status',
        String(status),
      );
      expect(screen.queryByTestId('pre-conditions')).not.toBeInTheDocument();
    },
  );

  it.each([
    ['notFound', NotFound, HttpStatusCode.NotFound],
    ['notFoundCatchall', NotFoundCatchall, HttpStatusCode.NotFound],
    ['serverError', ServerError, HttpStatusCode.InternalServerError],
  ] satisfies [string, ComponentType, number][])(
    'renders the %s route inside page preconditions with the header and footer',
    (_name, Route, status) => {
      expect.hasAssertions();

      render(<Route />);

      const preConditions = screen.getByTestId('pre-conditions');

      expect(preConditions).toHaveAttribute('data-header-and-footer', 'true');
      expect(preConditions).toContainElement(
        screen.getByTestId('error-display'),
      );
      expect(screen.getByTestId('error-display')).toHaveAttribute(
        'data-status',
        String(status),
      );
    },
  );

  it('builds independent named route components from the factories', () => {
    expect.hasAssertions();

    const authenticated = createAuthenticatedErrorRoute(HttpStatusCode.Gone);
    const precondition = createPreconditionErrorRoute(HttpStatusCode.Gone);

    expect(authenticated.name).toBe('AuthenticatedErrorRoute');
    expect(precondition.name).toBe('PreconditionErrorRoute');
    expect(authenticated).not.toBe(
      createAuthenticatedErrorRoute(HttpStatusCode.Gone),
    );
  });
});
