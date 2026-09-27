import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { RhfCompatStatusContext, useFormikContext } from '@/components/forms/FormikForm/rhfCompat';

interface FormValues {
    email: string;
}

function TestContextConsumer(): JSX.Element {
    const { values, dirty, isValid, isSubmitting, submitCount, status, handleSubmit, setFieldValue } = useFormikContext<FormValues>();

    const onValid = async (): Promise<void> => {
        await new Promise((resolve) => {
            setTimeout(resolve, 10);
        });
    };

    return (
        <form onSubmit={handleSubmit(onValid)}>
            <span data-testid='values'>{JSON.stringify(values)}</span>
            <span data-testid='dirty'>{String(dirty)}</span>
            <span data-testid='is-valid'>{String(isValid)}</span>
            <span data-testid='is-submitting'>{String(isSubmitting)}</span>
            <span data-testid='submit-count'>{submitCount}</span>
            <span data-testid='hidden-status'>{String(status.hidden)}</span>
            <button type='button' data-testid='set-value' onClick={() => setFieldValue('email', 'set@by.helper')}>
                setFieldValue
            </button>
            <button type='submit' data-testid='submit'>
                submit
            </button>
        </form>
    );
}

function Harness(): JSX.Element {
    const methods = useForm<FormValues>({ defaultValues: { email: '' } });

    return (
        <FormProvider {...methods}>
            <TestContextConsumer />
        </FormProvider>
    );
}

describe('rhfCompat useFormikContext', () => {
    it('reflects values, dirty, isSubmitting and submitCount from real RHF state', async () => {
        render(<Harness />);

        // RHF's formState is a lazily-subscribed proxy; flush its post-mount
        // subscription update before asserting, same as reading it would in app code.
        await screen.findByTestId('values');

        expect(screen.getByTestId('values')).toHaveTextContent('{"email":""}');
        expect(screen.getByTestId('dirty')).toHaveTextContent('false');
        expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
        expect(screen.getByTestId('submit-count')).toHaveTextContent('0');

        await userEvent.click(screen.getByTestId('set-value'));

        expect(screen.getByTestId('values')).toHaveTextContent('{"email":"set@by.helper"}');
        expect(screen.getByTestId('dirty')).toHaveTextContent('true');

        const submitClick = userEvent.click(screen.getByTestId('submit'));

        await waitFor(() => expect(screen.getByTestId('is-submitting')).toHaveTextContent('true'));
        await submitClick;
        await waitFor(() => expect(screen.getByTestId('is-submitting')).toHaveTextContent('false'));

        // No validation rules are defined, so RHF resolves the field as valid
        // once submit has triggered its first validation pass.
        expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
        expect(screen.getByTestId('submit-count')).toHaveTextContent('1');
    });

    it('defaults status.hidden to undefined when no RhfCompatStatusContext provider is present', async () => {
        render(<Harness />);

        expect(await screen.findByTestId('hidden-status')).toHaveTextContent('undefined');
    });

    it('reads status.hidden from RhfCompatStatusContext when a provider supplies it', async () => {
        render(
            <RhfCompatStatusContext.Provider value={{ hidden: { email: true } }}>
                <Harness />
            </RhfCompatStatusContext.Provider>,
        );

        expect(await screen.findByTestId('hidden-status')).toHaveTextContent('[object Object]');
    });
});
