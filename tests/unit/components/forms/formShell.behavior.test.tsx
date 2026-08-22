import {
    act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, useFormikContext } from 'formik';
import { MemoryRouter } from 'react-router';
import FormikForm from '@/components/forms/FormikForm';
import ErrorSummary from '@/components/forms/ErrorSummary';
import ContactDetailsInput from '@/components/forms/CommonForms/ContactDetails';
import { HttpStatusCode } from '@/types';
import * as Yup from 'yup';

vi.mock('@/components/forms/UnsavedFormPrompt', () => ({
    default: () => <div data-testid='unsaved-form-prompt' />,
}));

vi.mock('@/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <output>
            {children}
        </output>
    ),
}));

function ValuesProbe() {
    const { values, setFieldValue, submitForm } = useFormikContext<Record<string, unknown>>();
    return (
        <>
            <pre data-testid='values'>{JSON.stringify(values)}</pre>
            <button
                type='button'
                onClick={async () => {
                    await setFieldValue('saveAndExit', true);
                    await submitForm();
                }}
            >
                Save draft
            </button>
        </>
    );
}

describe('form shell behavior slice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('FormikForm validates hard, renders function children, and submits normalized values', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const validateHard = vi
            .fn()
            .mockReturnValueOnce({ firstName: 'First name is required' })
            .mockReturnValue({});

        render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{
                        firstName: '',
                        keep: 'value',
                        emptyValue: '',
                        submitClick: true,
                    }}
                    validateHard={validateHard}
                    onSubmit={onSubmit}
                    promptPath='/form'
                    showBanner={false}
                >
                    {({ errors, handleSubmit, setFieldValue }) => (
                        <Form onSubmit={handleSubmit}>
                            <div>{errors.firstName as string}</div>
                            <button
                                type='button'
                                onClick={() => setFieldValue('firstName', 'Alex')}
                            >
                                Fill name
                            </button>
                            <button type='submit'>Submit</button>
                        </Form>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('button', { name: 'Submit' }));

        expect(await screen.findByText('First name is required')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Fill name' }));
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
            { firstName: 'Alex', keep: 'value' },
            expect.objectContaining({ setSubmitting: expect.any(Function) }),
        ));
    });

    it('FormikForm uses soft validation and onSaveAndExit for draft saves', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onSaveAndExit = vi.fn().mockResolvedValue(undefined);
        const validateSoft = vi.fn().mockReturnValue({});

        render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{
                        saveAndExit: false,
                        notes: 'draft',
                        hiddenValue: 'remove me',
                    }}
                    validateSoft={validateSoft}
                    onSubmit={onSubmit}
                    onSaveAndExit={onSaveAndExit}
                    hidingFields={{ hiddenValue: true }}
                    promptPath='/draft'
                    showBanner={false}
                >
                    <Form>
                        <ValuesProbe />
                    </Form>
                </FormikForm>
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('button', { name: 'Save draft' }));

        await waitFor(() => {
            expect(validateSoft).toHaveBeenCalledWith(expect.objectContaining({ saveAndExit: true }));
            expect(onSaveAndExit).toHaveBeenCalledWith(
                { notes: 'draft' },
                expect.objectContaining({ setSubmitting: expect.any(Function) }),
            );
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('FormikForm shows loading and custom banner branches', () => {
        render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{}}
                    onSubmit={vi.fn()}
                    isLoading
                    banner={<div>Custom banner</div>}
                    promptPath='/loading'
                >
                    <Form>
                        <span>Loaded form</span>
                    </Form>
                </FormikForm>
            </MemoryRouter>,
        );

        expect(screen.getByText('Custom banner')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Loading...');
        expect(screen.getByTestId('unsaved-form-prompt')).toBeInTheDocument();
    });

    it('FormikForm validates soft and hard Yup schemas and supports empty children', async () => {
        const softSchema = Yup.object({
            draftName: Yup.string().required('Draft name required'),
        });
        const hardSchema = Yup.object({
            finalName: Yup.string().required('Final name required'),
        });

        const { rerender } = render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ saveAndExit: true, draftName: '' }}
                    validateSoft={softSchema}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    {({ errors, validateForm }) => (
                        <button type='button' onClick={() => void validateForm()}>
                            {String(errors.draftName ?? 'Validate soft')}
                        </button>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Validate soft' }));
        expect(await screen.findByRole('button', { name: 'Draft name required' })).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ saveAndExit: false, finalName: '' }}
                    validateHard={hardSchema}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    {({ errors, validateForm }) => (
                        <button type='button' onClick={() => void validateForm()}>
                            {String(errors.finalName ?? 'Validate hard')}
                        </button>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Validate hard' }));
        expect(await screen.findByRole('button', { name: 'Final name required' })).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <FormikForm initialValues={{}} onSubmit={vi.fn()} showBanner={false}>
                    {null}
                </FormikForm>
            </MemoryRouter>,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('FormikForm renders the saving spinner while submission is pending', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ value: 'pending' }}
                    onSubmit={() => new Promise(() => {})}
                    showBanner
                    bannerTitle='Pending form'
                >
                    {({ handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                            <button type='submit'>Start save</button>
                        </Form>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        expect(screen.getByText('Pending form')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Start save' }));
        expect(await screen.findByText('Saving...')).toBeInTheDocument();
    });

    it('ErrorSummary renders remaining server error branches and Formik nested errors', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <MemoryRouter>
                <ErrorSummary serverErrors={{ status: HttpStatusCode.Conflict } as any} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Another person has already saved this page/i)).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <ErrorSummary serverErrors={{ status: HttpStatusCode.Forbidden } as any} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Please contact support/i)).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <ErrorSummary serverErrors={{ status: 500 } as any} />
            </MemoryRouter>,
        );

        expect(screen.getByText('Server error')).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ contacts: [{ firstName: '' }] }}
                    validateHard={() => ({ contacts: [{ firstName: 'Required' }] })}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    {({ handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                            <ErrorSummary />
                            <button type='submit'>Continue</button>
                        </Form>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Contacts: (#1): Required');
        expect(screen.getByRole('link', { name: 'Contacts: (#1): Required' }))
            .toHaveAttribute('href', '#contacts.0.firstName');
    });

    it('ErrorSummary ignores empty nested errors instead of stringifying them', async () => {
        vi.useFakeTimers();
        const scrollIntoView = vi.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView,
        });

        render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ group: {} }}
                    validateHard={() => ({ group: {} })}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    {({ handleSubmit }) => (
                        <Form onSubmit={handleSubmit}>
                            <ErrorSummary disableLinkedError />
                            <button type='submit'>Validate empty group</button>
                        </Form>
                    )}
                </FormikForm>
            </MemoryRouter>,
        );

        try {
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Validate empty group' }));
                await Promise.resolve();
            });
            await act(async () => {
                await vi.runAllTimersAsync();
            });

            expect(scrollIntoView).not.toHaveBeenCalled();
            expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
            expect(screen.queryByTestId('form-error-summary')).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('ContactDetails renders editable labels and summary fallback/details branches', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <MemoryRouter>
                <FormikForm
                    initialValues={{
                        organisationAndContact: {
                            contact: {
                                title: '',
                                titleOther: '',
                                firstName: '',
                                lastName: '',
                                role: '',
                                phone: '',
                                mobile: '',
                                email: '',
                            },
                        },
                    }}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    <Form>
                        <ContactDetailsInput
                            name='organisationAndContact.contact'
                            firstNameLabel='Given name'
                            businessPhoneLabel='Office phone'
                        />
                        <ValuesProbe />
                    </Form>
                </FormikForm>
            </MemoryRouter>,
        );

        await user.type(screen.getByRole('textbox', { name: 'Given name' }), 'Priya');
        await user.type(screen.getByRole('textbox', { name: 'Office phone' }), '0299998888');

        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"firstName":"Priya"');
            expect(screen.getByTestId('values')).toHaveTextContent('"phone":"02 9999 8888"');
        });

        rerender(
            <MemoryRouter>
                <FormikForm
                    initialValues={{
                        organisationAndContact: {
                            contact: {
                                title: '',
                                firstName: 'Priya',
                                lastName: 'Singh',
                                role: 'Manager',
                                phone: '0299998888',
                                mobile: '0412345678',
                                email: 'priya@example.test',
                            },
                        },
                    }}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    <ContactDetailsInput name='organisationAndContact.contact' isSummary />
                </FormikForm>
            </MemoryRouter>,
        );

        expect(screen.getByText('First name')).toBeInTheDocument();
        expect(screen.getByText('Priya')).toBeInTheDocument();
        expect(screen.getByText('Business phone')).toBeInTheDocument();
        expect(screen.getByText('02 9999 8888')).toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <FormikForm
                    initialValues={{ organisationAndContact: { contact: '' } }}
                    onSubmit={vi.fn()}
                    showBanner={false}
                >
                    <ContactDetailsInput name='organisationAndContact.contact' isSummary />
                </FormikForm>
            </MemoryRouter>,
        );

        expect(screen.getByText('No details added')).toBeInTheDocument();
    });
});
