import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Form, Formik, useFormikContext } from 'formik';
import type { FormikConfig, FormikValues } from 'formik';
import { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import * as Yup from 'yup';
import Details from '@/components/forms/Details';
import FormBanner from '@/components/forms/FormBanner';
import HidableField from '@/components/forms/HidableField';
import UnsavedFormPrompt from '@/components/forms/UnsavedFormPrompt';
import countOfErrors from '@/components/forms/FormikForm/formikHelpers';
import {
    isHidden,
    removeHidden,
    validateForm,
} from '@/components/forms/utils';

vi.mock('@/components/RouteLeavingGuard', () => ({
    default: ({ when, title, body, confirmBtn }: {
        when?: boolean;
        title?: string;
        body?: string;
        confirmBtn?: string;
    }) => (
        <div
            data-testid='route-leaving-guard'
            data-when={String(Boolean(when))}
            data-title={title ?? ''}
            data-body={body ?? ''}
            data-confirm={confirmBtn ?? ''}
        />
    ),
}));

interface FormikHarnessProps<TValues extends FormikValues> {
    readonly initialValues: TValues;
    readonly initialStatus?: FormikConfig<TValues>['initialStatus'];
    readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
    readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
    readonly validate?: FormikConfig<TValues>['validate'];
    readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
    readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
    initialValues,
    initialStatus,
    initialErrors,
    initialTouched,
    validate,
    onSubmit = async () => {},
    children,
}: FormikHarnessProps<TValues>) {
    return (
        <Formik
            enableReinitialize
            initialValues={initialValues}
            initialStatus={initialStatus}
            initialErrors={initialErrors}
            initialTouched={initialTouched}
            validate={validate}
            onSubmit={onSubmit}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

function LocationProbe() {
    const location = useLocation();
    return <p data-testid='location'>{location.pathname}</p>;
}

describe('form helper components', () => {
    it('renders Details as a native disclosure with supplied help content', async () => {
        const user = userEvent.setup();
        render(<Details id='details-help' title='Why we ask' inlineHelp={<p>Used for service updates.</p>} />);

        const disclosure = screen.getByText('Why we ask').closest('details');
        expect(disclosure).toHaveAttribute('id', 'details-help');
        expect(disclosure).not.toHaveAttribute('open');

        await user.click(screen.getByText('Why we ask'));

        expect(disclosure).toHaveAttribute('open');
        expect(screen.getByText('Used for service updates.')).toBeInTheDocument();
    });

    it('renders FormBanner title metadata and navigates after discard callback', async () => {
        const user = userEvent.setup();
        const onDiscard = vi.fn();

        render(
            <MemoryRouter initialEntries={['/quote/edit']}>
                <FormBanner
                    title='Request for quote'
                    refTitle='RFQ-123'
                    subTitle='Acme Pty Ltd'
                    discard={{
                        onDiscard,
                        locationOnDiscard: '/dashboard',
                        discardButtonTitle: 'Discard draft',
                    }}
                />
                <LocationProbe />
            </MemoryRouter>,
        );

        expect(screen.getByText('Request for quote')).toBeInTheDocument();
        expect(screen.getByText('RFQ-123')).toBeInTheDocument();
        expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Discard draft/i }));

        expect(onDiscard).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    });

    it('renders FormBanner dashboard action without optional title metadata', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <MemoryRouter>
                <FormBanner
                    title='Create account'
                    refTitle=''
                    subTitle={null}
                    showGoToDashboardButton
                />
            </MemoryRouter>,
        );

        expect(screen.queryByText('RFQ-123')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Go to dashboard/i })).toHaveAttribute('href', '/dashboard');

        rerender(
            <MemoryRouter>
                <FormBanner
                    title='Update contact'
                    discard={{
                        locationOnDiscard: '/dashboard',
                    }}
                />
                <LocationProbe />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /Discard changes/i })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Discard changes/i }));
        expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    });

    it('shows and hides HidableField based on form status rules', async () => {
        const { rerender } = render(
            <FormikHarness
                initialValues={{ account: { type: 'business', abn: '123' } }}
                initialStatus={{ hidden: { account: { abn: ({ account }: any) => account.type !== 'business' } } }}
            >
                <HidableField name='account.abn'>
                    <p>ABN field</p>
                </HidableField>
            </FormikHarness>,
        );

        await waitFor(() => expect(screen.getByText('ABN field')).toBeInTheDocument());

        rerender(
            <FormikHarness
                initialValues={{ account: { type: 'individual', abn: '123' } }}
                initialStatus={{ hidden: { account: { abn: ({ account }: any) => account.type !== 'business' } } }}
            >
                <HidableField name='account.abn'>
                    <p>ABN field</p>
                </HidableField>
            </FormikHarness>,
        );

        await waitFor(() => expect(screen.queryByText('ABN field')).not.toBeInTheDocument());
    });

    it('passes create-account logout wording to UnsavedFormPrompt when dirty and unsubmitted', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ name: '' }}>
                <label htmlFor='name'>Name</label>
                <Field id='name' name='name' />
                <UnsavedFormPrompt path='/create-account/' />
            </FormikHarness>,
        );

        await user.type(screen.getByLabelText('Name'), 'Alex');

        const guard = screen.getByTestId('route-leaving-guard');
        expect(guard).toHaveAttribute('data-when', 'true');
        expect(guard).toHaveAttribute('data-title', 'Are you sure you want to log out?');
        expect(guard).toHaveAttribute('data-confirm', 'Yes, logout');
    });

    it('uses logout wording for create-contact paths', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ name: '' }}>
                <label htmlFor='name'>Name</label>
                <Field id='name' name='name' />
                <UnsavedFormPrompt path='/create-contact/' />
            </FormikHarness>,
        );

        await user.type(screen.getByLabelText('Name'), 'Alex');

        expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute('data-title', 'Are you sure you want to log out?');
    });

    it('blocks UnsavedFormPrompt for server rejected clean forms and allows clean valid forms', async () => {
        const { rerender, unmount } = render(
            <FormikHarness initialValues={{ name: '' }}>
                <UnsavedFormPrompt />
            </FormikHarness>,
        );

        expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute('data-when', 'false');

        rerender(
            <FormikHarness
                initialValues={{ name: '' }}
                validate={() => ({ name: 'Server rejected' })}
                onSubmit={async () => {}}
            >
                <AutoSubmit />
                <UnsavedFormPrompt />
            </FormikHarness>,
        );

        await waitFor(() => expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute('data-when', 'true'));

        unmount();
        render(
            <FormikHarness initialValues={{ name: '' }}>
                <UnsavedFormPrompt />
            </FormikHarness>,
        );

        expect(screen.getByTestId('route-leaving-guard')).toHaveAttribute('data-when', 'false');
    });
});

function AutoSubmit() {
    const { submitForm } = useFormikContext();
    useEffect(() => {
        void submitForm();
    }, [submitForm]);

    return null;
}

describe('form utility helpers', () => {
    it('counts top-level Formik error keys only when the value is object-like', () => {
        expect(countOfErrors({ firstName: 'Required', lastName: 'Required' })).toBe(2);
        expect(countOfErrors('not an object' as any)).toBe(0);
    });

    it('detects hidden fields from direct, group, ancestor, and callback rules', () => {
        const values = { applicant: { sameAddress: true } };
        const hidden = {
            applicant: {
                residentialAddress: {
                    this: ({ applicant }: typeof values) => applicant.sameAddress,
                },
                phone: true,
            },
        };

        expect(isHidden('applicant.phone', hidden as never, values)).toBe(true);
        expect(isHidden('applicant.residentialAddress.street', hidden as never, values)).toBe(true);
        expect(isHidden('applicant.email', hidden as never, values)).toBe(false);
    });

    it('removes hidden object fields while preserving visible array entries', () => {
        const values = {
            applicant: {
                name: 'Alex',
                phone: '0400000000',
                addresses: [
                    { street: 'Visible street', secret: 'Hidden note' },
                ],
            },
        };
        const hidden = {
            applicant: { phone: true },
            addresses: {
                secret: true,
            },
        };

        expect(removeHidden(values, values, hidden as never)).toEqual({
            applicant: {
                name: 'Alex',
                addresses: [
                    { street: 'Visible street' },
                ],
            },
        });

        expect(removeHidden({ tags: ['visible'] }, values, {})).toEqual({ tags: ['visible'] });
    });

    it('validates forms and filters Yup errors for hidden fields', async () => {
        const schema = Yup.object({
            name: Yup.string().required('Name is required'),
            phone: Yup.string().required('Phone is required'),
        });

        const errors = await validateForm(schema, { phone: true })({ name: '', phone: '' });

        expect(errors).toEqual({ name: 'Name is required' });
    });

    it('maps a single Yup validation error when the field is visible', async () => {
        const error = new Yup.ValidationError('Name is required', '', 'name');
        const schema = {
            validate: vi.fn().mockRejectedValue(error),
        };

        await expect(validateForm(schema, {})({ name: '' })).resolves.toEqual({ name: 'Name is required' });
    });

    it('returns no errors without a schema and rethrows non-validation failures', async () => {
        await expect(validateForm(undefined, {})({ name: '' })).resolves.toEqual({});

        const schema = {
            validate: vi.fn().mockRejectedValue(new Error('Network failed')),
        };

        await expect(validateForm(schema, {})({ name: '' })).rejects.toThrow('Network failed');
    });

    it('returns no errors for ValidationError-shaped failures without inner errors', async () => {
        const noInner = {
            validate: vi.fn().mockRejectedValue({
                name: 'ValidationError',
                message: 'Invalid',
                path: 'name',
                inner: undefined,
            }),
        };
        const emptyInnerWithoutPath = {
            validate: vi.fn().mockRejectedValue({
                name: 'ValidationError',
                message: 'Invalid',
                path: undefined,
                inner: [],
            }),
        };

        await expect(validateForm(noInner, {})({ name: '' })).resolves.toEqual({});
        await expect(validateForm(emptyInnerWithoutPath, {})({ name: '' })).resolves.toEqual({});
    });
});
