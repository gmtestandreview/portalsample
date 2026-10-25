import { act, render, screen } from '@testing-library/react';

import { Form, Formik, type FormikProps } from 'formik';

import { MemoryRouter } from 'react-router';

import { afterEach, vi, describe, beforeEach, it, expect } from 'vitest';

import ErrorSummary from '@/components/forms/ErrorSummary';

import { HttpStatusCode } from '@/types';

afterEach(() => {
  vi.useRealTimers();
});

const TestRouter = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe(ErrorSummary, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('normalizes validation error keys and renders linked errors', () => {
    expect.assertions(1);
    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                'formStep.Contact[0].FirstName': ['Required'],
              },
            } as any
          }
          prefixToRemove='formStep.'
        />
      </TestRouter>,
    );

    const link = screen.getByRole('link', { name: 'Contact: (#1): Required' });

    expect(link).toHaveAttribute('href', '#contact.0.firstName');
  });
});

describe(ErrorSummary, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders non-linked validation errors when disableLinkedError is true', () => {
    expect.assertions(2);
    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                'formStep.Contact[0].FirstName': ['Required'],
              },
            } as any
          }
          prefixToRemove='formStep.'
          disableLinkedError
        />
      </TestRouter>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Contact: (#1): Required')).toBeInTheDocument();
  });
});

describe(ErrorSummary, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the WAF violation message', () => {
    expect.assertions(2);
    render(
      <TestRouter>
        <ErrorSummary isWafViolation />
      </TestRouter>,
    );

    expect(
      screen.getByText(/This form contains invalid characters/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please avoid special characters/i),
    ).toBeInTheDocument();
  });
});
