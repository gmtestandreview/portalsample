import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { Field } from '@/components/forms/FormikForm/rhfCompat';

interface CheckboxFormValues {
    accepted: boolean;
}

function CheckboxHarness(): JSX.Element {
    const methods = useForm<CheckboxFormValues>({ defaultValues: { accepted: false } });

    return (
        <FormProvider {...methods}>
            <Field name='accepted' type='checkbox' data-testid='accepted-checkbox' />
        </FormProvider>
    );
}

interface RadioFormValues {
    choice: string;
}

function RadioHarness(): JSX.Element {
    const methods = useForm<RadioFormValues>({ defaultValues: { choice: 'a' } });

    return (
        <FormProvider {...methods}>
            <Field name='choice' type='radio' value='a' data-testid='choice-a' />
            <Field name='choice' type='radio' value='b' data-testid='choice-b' />
        </FormProvider>
    );
}

describe('rhfCompat Field', () => {
    it('renders an unchecked checkbox reflecting a boolean field value and toggles on click', async () => {
        render(<CheckboxHarness />);

        const checkbox = screen.getByTestId('accepted-checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);

        await userEvent.click(checkbox);

        expect(checkbox.checked).toBe(true);
    });

    it('renders radio inputs with checked state derived from field value and updates on selection', async () => {
        render(<RadioHarness />);

        const optionA = screen.getByTestId('choice-a') as HTMLInputElement;
        const optionB = screen.getByTestId('choice-b') as HTMLInputElement;

        expect(optionA.checked).toBe(true);
        expect(optionB.checked).toBe(false);

        await userEvent.click(optionB);

        expect(optionA.checked).toBe(false);
        expect(optionB.checked).toBe(true);
    });
});
