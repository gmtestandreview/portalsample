import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import type { FormikConfig, FormikValues } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import CheckboxGroup from '@/components/Inputs/CheckboxGroup';

interface FormikHarnessProps<TValues extends FormikValues> {
    readonly initialValues: TValues;
    readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
    readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
    readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
    initialValues,
    initialTouched,
    initialErrors,
    children,
}: FormikHarnessProps<TValues>) {
    return (
        <Formik
            initialValues={initialValues}
            initialTouched={initialTouched}
            initialErrors={initialErrors}
            onSubmit={async () => {}}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

const contactOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
];

describe('CheckboxGroup', () => {
    it('renders vertical options with plain inline help and validation feedback', () => {
        render(
            <FormikHarness
                initialValues={{ contactMethod: '' }}
                initialTouched={{ contactMethod: true }}
                initialErrors={{ contactMethod: 'Choose at least one method' }}
            >
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                    inlineHelp='Select every method we can use'
                    containerClassName='contact-container'
                    legendClassName='contact-legend'
                    className='contact-checkbox'
                />
            </FormikHarness>,
        );

        const fieldset = screen.getByTestId('fs-contactMethod');
        expect(fieldset).toHaveAccessibleName('Contact method');
        expect(fieldset).toHaveAttribute('aria-describedby', 'contactMethod-validation-msg');
        expect(screen.getByText('Select every method we can use')).toHaveAttribute('id', 'help-contactMethod');
        expect(screen.getAllByText('Choose at least one method')).toHaveLength(3);
        expect(screen.getAllByText('Choose at least one method')[0]).toHaveClass('form-validation-message');
        expect(screen.getByRole('group', { name: 'Contact method' })).toBe(fieldset);
        expect(screen.getByText('Contact method')).toHaveClass('contact-legend');
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
        expect(screen.getByText('Email').closest('.checkbox')).toHaveClass('contact-checkbox');
        expect(screen.getByText('SMS')).toBeInTheDocument();
        expect(document.querySelector('.contact-container')).toBeInTheDocument();
    });

    it('renders titled help, horizontal options, and forwards option changes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <FormikHarness initialValues={{ contactMethod: '' }}>
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                    inlineHelp='The selected method is used for updates'
                    inlineHelpTitle='Choosing a contact method'
                    displayHorizontally
                    onChange={onChange}
                />
            </FormikHarness>,
        );

        const fieldset = screen.getByTestId('fs-contactMethod');
        expect(fieldset).toHaveAttribute('aria-describedby', 'help-contactMethod');
        expect(screen.getByText('Choosing a contact method')).toBeInTheDocument();
        const row = fieldset.querySelector('.row');
        expect(row).not.toBeNull();
        expect(within(row as HTMLElement).getAllByRole('checkbox')).toHaveLength(2);

        await user.click(within(row as HTMLElement).getAllByRole('checkbox')[0]);

        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('omits describedby when there is no inline help or validation message', () => {
        render(
            <FormikHarness initialValues={{ contactMethod: '' }}>
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                />
            </FormikHarness>,
        );

        expect(screen.getByTestId('fs-contactMethod')).not.toHaveAttribute('aria-describedby');
    });

    it('renders the selected option label in summary mode', () => {
        render(
            <FormikHarness initialValues={{ contactMethod: 'sms' }}>
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                    isSummary
                    containerClassName='summary-container'
                    className='summary-value'
                />
            </FormikHarness>,
        );

        expect(screen.getByText('Contact method')).toBeInTheDocument();
        expect(screen.getByText('SMS')).toHaveClass('summary-value');
        expect(document.querySelector('.summary-container')).toBeInTheDocument();
    });

    it('renders nothing in summary mode when the field is empty', () => {
        const { container } = render(
            <FormikHarness initialValues={{ contactMethod: '' }}>
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                    isSummary
                />
            </FormikHarness>,
        );

        expect(container).not.toHaveTextContent('Contact method');
        expect(container.querySelector('fieldset')).not.toBeInTheDocument();
    });

    it('renders nothing in summary mode when the selected field value is unmatched', () => {
        const { container } = render(
            <FormikHarness initialValues={{ contactMethod: 'fax' }}>
                <CheckboxGroup
                    name='contactMethod'
                    legend='Contact method'
                    options={contactOptions}
                    isSummary
                />
            </FormikHarness>,
        );

        expect(container).not.toHaveTextContent('Contact method');
        expect(container.querySelector('fieldset')).not.toBeInTheDocument();
    });
});
