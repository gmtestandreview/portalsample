import { render, screen } from '@testing-library/react';

import { SeverityLevel } from '@microsoft/applicationinsights-common';

import { MemoryRouter } from 'react-router';

import { afterEach, describe, expect, it, vi } from 'vitest';

import ErrorBoundary from '@/components/ErrorBoundary';

import ErrorDisplay from '@/components/ErrorBoundary/ErrorDisplay';

import { HttpStatusCode } from '@/types';

const renderErrorDisplay = (status: HttpStatusCode | number) =>
  render(
    <MemoryRouter>
      <ErrorDisplay status={status} />
    </MemoryRouter>,
  );

describe(ErrorDisplay, () => {
  afterEach(() => {
    document.body.className = '';
    document.title = '';
  });
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
    expect.assertions(5);
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
