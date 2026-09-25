import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormikContext } from 'formik';
import SaveAndExitButton from '@/components/forms/SaveAndExitButton';
import SubmitFormButton from '@/components/forms/SubmitFormButton';
import { FormikWrapper } from '../../helpers/formik';

function ValuesProbe() {
    const { values } = useFormikContext<Record<string, unknown>>();
    return <pre data-testid='values'>{JSON.stringify(values)}</pre>;
}

describe('form button controls', () => {
    it('renders SaveAndExitButton default text and submits after click', async () => {
        const onSubmit = vi.fn();
        render(
            <FormikWrapper
                initialValues={{ saveAndExit: false, saveAndExitClick: false }}
                onSubmit={onSubmit}
            >
                <SaveAndExitButton />
                <ValuesProbe />
            </FormikWrapper>,
        );

        await userEvent.click(screen.getByTestId('save-and-exit-button'));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"saveAndExit":true'));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"saveAndExitClick":false'));
    });

    it('renders SaveAndExitButton via render prop', async () => {
        const onSubmit = vi.fn();
        render(
            <FormikWrapper
                initialValues={{ saveAndExit: false, saveAndExitClick: false }}
                onSubmit={onSubmit}
            >
                <SaveAndExitButton>
                    {(onClick) => <button type='button' onClick={onClick}>Custom save</button>}
                </SaveAndExitButton>
            </FormikWrapper>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Custom save' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });

    it('renders SubmitFormButton default text and submits after click', async () => {
        const onSubmit = vi.fn();
        render(
            <FormikWrapper
                initialValues={{ saveAndExit: true, submitClick: false }}
                onSubmit={onSubmit}
            >
                <SubmitFormButton />
                <ValuesProbe />
            </FormikWrapper>,
        );

        await userEvent.click(screen.getByTestId('submit-button'));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"saveAndExit":false'));
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"submitClick":false'));
    });

    it('renders SubmitFormButton via render prop', async () => {
        const onSubmit = vi.fn();
        render(
            <FormikWrapper
                initialValues={{ saveAndExit: false, submitClick: false }}
                onSubmit={onSubmit}
            >
                <SubmitFormButton>
                    {(onClick) => <button type='button' onClick={onClick}>Custom submit</button>}
                </SubmitFormButton>
            </FormikWrapper>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Custom submit' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    });
});
