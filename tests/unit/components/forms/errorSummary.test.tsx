import { act, render, screen } from '@testing-library/react';
import { Form, Formik, type FormikProps } from 'formik';
import { MemoryRouter } from 'react-router';
import { afterEach, vi } from 'vitest';
import ErrorSummary from '@/components/forms/ErrorSummary';
import { HttpStatusCode } from '@/types';

afterEach(() => {
    vi.useRealTimers();
});

const TestRouter = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
        {children}
    </MemoryRouter>
);

describe('ErrorSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('normalizes validation error keys and renders linked errors', () => {
        render(
            <TestRouter>
                <ErrorSummary
                    serverErrors={{
                        errors: {
                            'formStep.Contact[0].FirstName': ['Required'],
                        },
                    } as any}
                    prefixToRemove='formStep.'
                />
            </TestRouter>,
        );

        const link = screen.getByRole('link', { name: 'Contact: (#1): Required' });
        expect(link).toHaveAttribute('href', '#contact.0.firstName');
    });

    it('renders non-linked validation errors when disableLinkedError is true', () => {
        render(
            <TestRouter>
                <ErrorSummary
                    serverErrors={{
                        errors: {
                            'formStep.Contact[0].FirstName': ['Required'],
                        },
                    } as any}
                    prefixToRemove='formStep.'
                    disableLinkedError
                />
            </TestRouter>,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('Contact: (#1): Required')).toBeInTheDocument();
    });

    it('renders the WAF violation message', () => {
        render(
            <TestRouter>
                <ErrorSummary isWafViolation />
            </TestRouter>,
        );

        expect(screen.getByText(/This form contains invalid characters/i)).toBeInTheDocument();
        expect(screen.getByText(/Please avoid special characters/i)).toBeInTheDocument();
    });

    it('renders the unprocessable entity server error branch', () => {
        render(
            <TestRouter>
                <ErrorSummary
                    serverErrors={{ status: HttpStatusCode.UnprocessableEntity } as any}
                />
            </TestRouter>,
        );

        expect(screen.getByText(/Another person has already submitted this form/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to the Dashboard/i })).toHaveAttribute('href', '/dashboard');
    });

    it('handles validation errors without a prefix and preserves empty arrays', () => {
        render(
            <TestRouter>
                <ErrorSummary
                    serverErrors={{
                        errors: {
                            Contact: [],
                            FirstName: ['Required'],
                        },
                    } as any}
                />
            </TestRouter>,
        );

        expect(screen.getByRole('link', { name: 'First name: Required' })).toHaveAttribute('href', '#firstName');
        expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('falls through when validation problem details has no errors collection', () => {
        render(
            <TestRouter>
                <Formik initialValues={{}} onSubmit={vi.fn()}>
                    <ErrorSummary serverErrors={{ errors: undefined } as any} />
                </Formik>
            </TestRouter>,
        );

        expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('calls scrollIntoView on the error summary element when handleAlertScroll fires after the timeout', () => {
        vi.useFakeTimers();
        // disableLinkedError=true triggers handleAlertScroll inside renderErrorListItem;
        // the rendered Alert has id="form-error-summary" so the querySelector finds it.
        render(
            <TestRouter>
                <ErrorSummary
                    serverErrors={{ errors: { FirstName: ['Required'] } } as any}
                    disableLinkedError
                />
            </TestRouter>,
        );

        const summaryEl = document.querySelector('#form-error-summary') as HTMLElement;
        expect(summaryEl).not.toBeNull();

        act(() => { vi.advanceTimersByTime(150); });

        expect(summaryEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('skips undefined error entries in sanitizeErrorData (line 140 else-if false branch)', async () => {
        let formikInstance: FormikProps<{ name: string }> | null = null;

        render(
            <TestRouter>
                <Formik
                    initialValues={{ name: '' }}
                    validate={() => ({ name: undefined as any, extra: 'Shown' as any })}
                    onSubmit={vi.fn()}
                    innerRef={(instance) => { formikInstance = instance; }}
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

    it('calls handleAlertScroll in FormikErrorsSummary when isSubmitting=true with existing errors', async () => {
        vi.useFakeTimers();

        let formikInstance: FormikProps<{ name: string }> | null = null;

        render(
            <TestRouter>
                <Formik
                    initialValues={{ name: '' }}
                    validate={(values) => (values.name ? {} : { name: 'Required' })}
                    onSubmit={vi.fn()}
                    innerRef={(instance) => { formikInstance = instance; }}
                >
                    <Form>
                        <ErrorSummary />
                    </Form>
                </Formik>
            </TestRouter>,
        );

        // Submit once: sets submitCount=1 and errors → errorSummary state updates → hasErrors=true
        await act(async () => {
            await formikInstance!.submitForm();
        });

        expect(document.querySelector('#form-error-summary')).not.toBeNull();

        // Set isSubmitting=true directly while hasErrors=true and isValidating=false.
        // This triggers the useEffect condition: isSubmitting && !isValidating && hasErrors → handleAlertScroll()
        await act(async () => {
            formikInstance!.setSubmitting(true);
        });

        act(() => { vi.advanceTimersByTime(200); });

        expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

});
