import { act, render, screen } from '@testing-library/react';
import { Form, Formik, type FormikConfig, type FormikProps } from 'formik';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect } from 'vitest';
import ErrorSummary from '@/components/forms/ErrorSummary';
import type {
  ProblemDetails,
  ValidationProblemDetails,
} from '@/api/web-api-client';
import { HttpStatusCode } from '@/types';

type EmptyFormikSubmit = FormikConfig<Record<string, never>>['onSubmit'];
type NameFormikSubmit = FormikConfig<{ name: string }>['onSubmit'];

const TestRouter = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('error summary', () => {
  it('normalizes validation error keys and renders linked errors', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                'formStep.Contact[0].FirstName': ['Required'],
              },
            } satisfies ValidationProblemDetails
          }
          prefixToRemove='formStep.'
        />
      </TestRouter>,
    );

    const link = screen.getByRole('link', {
      name: 'Contact: (#1): Required',
    });

    expect(link).toHaveAttribute('href', '#contact.0.firstName');
  });

  it('renders non-linked validation errors when disableLinkedError is true', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                'formStep.Contact[0].FirstName': ['Required'],
              },
            } satisfies ValidationProblemDetails
          }
          prefixToRemove='formStep.'
          disableLinkedError
        />
      </TestRouter>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Contact: (#1): Required')).toBeInTheDocument();
  });

  it('renders the WAF violation message', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

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

  it('renders the unprocessable entity server error branch', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              status: HttpStatusCode.UnprocessableEntity,
            } satisfies ProblemDetails
          }
        />
      </TestRouter>,
    );

    expect(
      screen.getByText(/Another person has already submitted this form/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /go to the Dashboard/i }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('handles validation errors without a prefix and preserves empty arrays', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                Contact: [],
                FirstName: ['Required'],
              },
            } satisfies ValidationProblemDetails
          }
        />
      </TestRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'First name: Required' }),
    ).toHaveAttribute('href', '#firstName');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('formats camel-case and separator-based validation keys as sentences', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                ContactName: ['Required'],
                'Phone-number': ['Invalid'],
              },
            } satisfies ValidationProblemDetails
          }
        />
      </TestRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'Contact name: Required' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Phone number: Invalid' }),
    ).toBeInTheDocument();
  });

  it('renders a key whose segment reduces to an empty label after stripping separators', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <ErrorSummary
          serverErrors={
            {
              errors: {
                // The single "_" segment collapses to '' once separators are
                // stripped, so formatKeyPart returns the empty string unchanged.
                _: ['Required'],
              },
            } satisfies ValidationProblemDetails
          }
        />
      </TestRouter>,
    );

    expect(screen.getByRole('link', { name: /Required/ })).toBeInTheDocument();
  });

  it('falls through when validation problem details has no errors collection', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    render(
      <TestRouter>
        <Formik initialValues={{}} onSubmit={vi.fn<EmptyFormikSubmit>()}>
          <ErrorSummary serverErrors={{ errors: undefined }} />
        </Formik>
      </TestRouter>,
    );

    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('calls scrollIntoView on the error summary element when handleAlertScroll fires after the timeout', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    vi.useFakeTimers();
    try {
      // disableLinkedError=true triggers handleAlertScroll inside renderErrorListItem;
      // the rendered Alert has id="form-error-summary" so the querySelector finds it.
      render(
        <TestRouter>
          <ErrorSummary
            serverErrors={
              {
                errors: { FirstName: ['Required'] },
              } satisfies ValidationProblemDetails
            }
            disableLinkedError
          />
        </TestRouter>,
      );
      const summaryEl = document.querySelector('#form-error-summary')!;
      const scrollIntoView = vi.spyOn(summaryEl, 'scrollIntoView');

      expect(summaryEl).not.toBeNull();

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not call scrollIntoView when the error summary element cannot be found when handleAlertScroll fires', () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    vi.useFakeTimers();
    const querySelectorSpy = vi.spyOn(document, 'querySelector');
    try {
      render(
        <TestRouter>
          <ErrorSummary
            serverErrors={
              {
                errors: { FirstName: ['Required'] },
              } satisfies ValidationProblemDetails
            }
          />
        </TestRouter>,
      );

      // Simulate document.querySelector('#form-error-summary') finding nothing when the
      // scheduled timeout fires, without touching the real DOM tree (which would desync
      // React's fiber tree from the document and break the render's own cleanup).
      querySelectorSpy.mockReturnValue(null);
      const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      querySelectorSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('skips undefined error entries in sanitizeErrorData (line 140 else-if false branch)', async () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    let formikInstance: FormikProps<{ name: string }> | null = null;

    render(
      <TestRouter>
        <Formik
          initialValues={{ name: '' }}
          validate={() => ({ name: undefined as any, extra: 'Shown' as any })}
          onSubmit={vi.fn<NameFormikSubmit>()}
          innerRef={(instance) => {
            formikInstance = instance;
          }}
        >
          <Form>
            <ErrorSummary />
          </Form>
        </Formik>
      </TestRouter>,
    );

    await act(async () => {
      await formikInstance!.submitForm();
    });

    // sanitizeErrorData is called with { name: undefined, extra: 'Shown' }.
    // 'name: undefined' exercises the else branch at line 140 (value is neither object nor string).
    expect(document.querySelector('#form-error-summary')).not.toBeNull();
  });

  it('scrolls and focuses the summary after a failed submit settles', async () => {
    expect.hasAssertions();

    vi.useRealTimers();
    vi.clearAllMocks();

    vi.useFakeTimers();

    try {
      let formikInstance: FormikProps<{ name: string }> | null = null;

      render(
        <TestRouter>
          <Formik
            initialValues={{ name: '' }}
            validate={(values) => (values.name ? {} : { name: 'Required' })}
            onSubmit={vi.fn<NameFormikSubmit>()}
            innerRef={(instance) => {
              formikInstance = instance;
            }}
          >
            <Form>
              <ErrorSummary />
            </Form>
          </Formik>
        </TestRouter>,
      );

      const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

      // Submit once: sets submitCount=1 and errors → errorSummary state updates → hasErrors=true
      await act(async () => {
        await formikInstance!.submitForm();
      });

      expect(document.querySelector('#form-error-summary')).not.toBeNull();

      // The failed submit above settles with errors and no pending submission, so
      // the summary schedules its focus once; let the timer fire.
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
