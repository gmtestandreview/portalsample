import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import DatePicker from '@/components/Inputs/DatePicker';
import type { CustomDatePickerProps } from '@/components/Inputs/DatePicker/types';

vi.mock('@/components/Inputs/DatePicker/CustomDatePicker', () => ({
    default: ({
        currentDate,
        dateOnBlur,
        dateOnChange,
        errorMessage,
        hasError,
        label,
        name,
        placeholder,
    }: CustomDatePickerProps) => (
        <div>
            <label htmlFor={name}>{label}</label>
            <input
                id={name}
                aria-invalid={hasError ? 'true' : undefined}
                aria-describedby={hasError ? `${name}-error` : undefined}
                placeholder={placeholder}
                defaultValue={currentDate ? currentDate.toISOString() : ''}
                onBlur={dateOnBlur}
            />
            {hasError ? <div id={`${name}-error`}>{errorMessage}</div> : null}
            <button type='button' onClick={() => dateOnChange(new Date('2026-06-12T00:00:00.000Z'))}>
                Pick date object
            </button>
            <button type='button' onClick={() => dateOnChange('2026-07-13T00:00:00+10:00')}>
                Pick valid string
            </button>
            <button type='button' onClick={() => dateOnChange('not a date')}>
                Pick invalid string
            </button>
            <button type='button' onClick={() => dateOnChange(null)}>
                Clear date
            </button>
        </div>
    ),
}));

interface HarnessProps {
    readonly children: React.ReactNode;
    readonly initialErrors?: Record<string, string>;
    readonly initialTouched?: Record<string, boolean>;
    readonly initialValues: Record<string, unknown>;
}

function Harness({
    children,
    initialErrors,
    initialTouched,
    initialValues,
}: HarnessProps) {
    return (
        <Formik
            enableReinitialize
            initialErrors={initialErrors}
            initialTouched={initialTouched}
            initialValues={initialValues}
            onSubmit={vi.fn()}
        >
            <Form>
                {children}
                <ValuesProbe />
            </Form>
        </Formik>
    );
}

function ValuesProbe() {
    const { touched, values } = useFormikContext<Record<string, unknown>>();
    return (
        <>
            <pre data-testid='values'>{JSON.stringify(values)}</pre>
            <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
        </>
    );
}

describe('DatePicker wrapper', () => {
    it('parses initial Formik values, forwards validation state, and normalizes date changes', async () => {
        const user = userEvent.setup();

        render(
            <Harness
                initialErrors={{ dueDate: 'Enter a valid date' }}
                initialTouched={{ dueDate: true }}
                initialValues={{ dueDate: '2026-06-11T00:00:00+10:00' }}
            >
                <DatePicker
                    name='dueDate'
                    label='Due date'
                    placeholder='dd/mm/yyyy'
                />
            </Harness>,
        );

        const input = screen.getByLabelText('Due date');
        expect(input).toHaveValue('2026-06-10T14:00:00.000Z');
        expect(input).toHaveAccessibleDescription('Enter a valid date');
        expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');

        await user.click(screen.getByRole('button', { name: 'Pick date object' }));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":"2026-06-12T00:00:00+10:00"'));

        await user.click(screen.getByRole('button', { name: 'Pick valid string' }));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":"2026-07-13T00:00:00+10:00"'));

        await user.click(screen.getByRole('button', { name: 'Pick invalid string' }));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":"not a date"'));

        await user.click(screen.getByRole('button', { name: 'Clear date' }));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":null'));
    });

    it('normalizes blur values only when the input value changed and marks the field touched', async () => {
        const user = userEvent.setup();

        render(
            <Harness initialValues={{ dueDate: '2026-06-11T00:00:00+10:00' }}>
                <DatePicker name='dueDate' label='Due date' />
            </Harness>,
        );

        const input = screen.getByLabelText('Due date');
        await user.clear(input);
        await user.type(input, '2026-08-14T00:00:00+10:00');
        await user.tab();

        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":"2026-08-14T00:00:00+10:00"');
            expect(screen.getByTestId('touched')).toHaveTextContent('"dueDate":true');
        });
    });

    it('keeps invalid initial values unparsed', () => {
        render(
            <Harness initialValues={{ dueDate: 'not a date' }}>
                <DatePicker name='dueDate' label='Due date' />
            </Harness>,
        );

        expect(screen.getByLabelText('Due date')).toHaveValue('');
        expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":"not a date"');
    });

    it('skips normalization on an unchanged empty blur', async () => {
        const user = userEvent.setup();

        render(
            <Harness initialValues={{ dueDate: '' }}>
                <DatePicker name='dueDate' label='Due date' />
            </Harness>,
        );

        const input = screen.getByLabelText('Due date');
        await user.click(input);
        await user.tab();

        await waitFor(() => {
            expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":""');
            expect(screen.getByTestId('touched')).toHaveTextContent('"dueDate":true');
        });
    });

    it('normalizes a cleared non-empty date to null on blur', async () => {
        const user = userEvent.setup();

        render(
            <Harness initialValues={{ dueDate: '2026-06-11T00:00:00+10:00' }}>
                <DatePicker name='dueDate' label='Due date' />
            </Harness>,
        );

        const input = screen.getByLabelText('Due date');
        await user.clear(input);
        await user.tab();

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"dueDate":null'));
    });

    it('renders summary values for string, Date, and empty inputs', () => {
        const { rerender } = render(
            <Harness initialValues={{ dueDate: '2026-06-11T00:00:00+10:00' }}>
                <DatePicker name='dueDate' label='Due date' isSummary />
            </Harness>,
        );

        expect(screen.getByText('Due date')).toBeInTheDocument();
        expect(screen.getByText('11 Jun 2026')).toBeInTheDocument();

        rerender(
            <Harness initialValues={{ dueDate: new Date('2026-06-12T00:00:00.000Z') }}>
                <DatePicker name='dueDate' label='Due date' isSummary />
            </Harness>,
        );

        expect(screen.getByText('12 Jun 2026')).toBeInTheDocument();

        rerender(
            <Harness initialValues={{ dueDate: '' }}>
                <DatePicker name='dueDate' label='Due date' isSummary />
            </Harness>,
        );

        expect(screen.getByText('Due date')).toBeInTheDocument();
    });
});
