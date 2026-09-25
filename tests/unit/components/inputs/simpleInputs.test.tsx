import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import type { FormikConfig, FormikValues } from 'formik';
import Checkbox from '@/components/Inputs/Checkbox';
import RadioButton from '@/components/Inputs/RadioButton';
import RadioButtonGroup from '@/components/Inputs/RadioButtonGroup';
import SelectInput from '@/components/Inputs/SelectInput';
import TextAreaInput from '@/components/Inputs/TextAreaInput';
import TextInput from '@/components/Inputs/TextInput';
import TextReadOnly from '@/components/Inputs/TextReadOnly';

interface FormikHarnessProps<TValues extends FormikValues> {
    readonly initialValues: TValues;
    readonly initialTouched?: FormikConfig<TValues>['initialTouched'];
    readonly initialErrors?: FormikConfig<TValues>['initialErrors'];
    readonly onSubmit?: FormikConfig<TValues>['onSubmit'];
    readonly children: React.ReactNode;
}

function FormikHarness<TValues extends FormikValues>({
    initialValues,
    initialTouched,
    initialErrors,
    onSubmit = async () => {},
    children,
}: FormikHarnessProps<TValues>) {
    return (
        <Formik
            enableReinitialize
            initialValues={initialValues}
            initialTouched={initialTouched}
            initialErrors={initialErrors}
            onSubmit={onSubmit}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

function ValuesProbe() {
    const { values, touched } = useFormikContext<Record<string, unknown>>();
    return (
        <>
            <pre data-testid='values'>{JSON.stringify(values)}</pre>
            <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
        </>
    );
}

describe('simple Formik input components', () => {
    it('associates Checkbox label/help text and updates the form value', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ accepted: false }}>
                <Checkbox
                    name='accepted'
                    label='I accept the terms'
                    descriptor='Required before continuing'
                    inlineHelp='Confirm you have read the terms'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const checkbox = screen.getByRole('checkbox', { name: /I accept the terms/i });
        expect(checkbox).toHaveAccessibleDescription('Confirm you have read the terms');
        expect(document.querySelector('.icon-tick')).toHaveAttribute('aria-hidden', 'true');
        expect(document.querySelector('.icon-tick')).not.toHaveAttribute('role');

        await user.click(checkbox);

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"accepted":true'));
    });

    it('renders Checkbox validation feedback when touched and not suppressed', () => {
        const { rerender } = render(
            <FormikHarness
                initialValues={{ accepted: false }}
                initialTouched={{ accepted: true }}
                initialErrors={{ accepted: 'You must accept' }}
            >
                <Checkbox name='accepted' label='Accept declaration' />
            </FormikHarness>,
        );

        const checkbox = screen.getByRole('checkbox', { name: 'Accept declaration' });
        expect(checkbox).toHaveAccessibleDescription('You must accept');
        expect(screen.getByText('You must accept')).toHaveClass('form-validation-message');

        rerender(
            <FormikHarness
                initialValues={{ accepted: false }}
                initialTouched={{ accepted: true }}
                initialErrors={{ accepted: 'You must accept' }}
            >
                <Checkbox name='accepted' label='Accept declaration' supressFieldLevelMessages />
            </FormikHarness>,
        );

        expect(screen.getByRole('checkbox', { name: 'Accept declaration' })).not.toHaveAccessibleDescription();
        expect(screen.queryByText('You must accept')).not.toBeInTheDocument();
    });

    it('renders Checkbox summary and subform content branches', () => {
        const { rerender } = render(
            <FormikHarness initialValues={{ accepted: true }}>
                <Checkbox name='accepted' label='Declaration accepted' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('Declaration accepted')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ accepted: false }}>
                <Checkbox name='accepted' label='Declaration accepted' subFormField={<p>Extra details</p>} />
            </FormikHarness>,
        );

        expect(screen.getByText('Extra details')).toBeInTheDocument();
    });

    it('renders RadioButton descriptor/subfield wiring and calls a custom change handler', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <FormikHarness initialValues={{ preference: 'yes' }}>
                <RadioButton
                    name='preference'
                    id='pref-no'
                    label='No'
                    value='no'
                    descriptor='Do not proceed'
                    onChange={onChange}
                    subFormField={<p>Reason details</p>}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const radio = screen.getByRole('radio', { name: /No\s*Do not proceed/i });
        expect(radio).not.toBeChecked();
        expect(radio).toHaveAttribute('aria-controls', 'pref-no-sub-field');
        expect(screen.getByText('Reason details')).toBeInTheDocument();

        await user.click(radio);

        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('renders RadioButtonGroup options, help details, error feedback, and summary label', async () => {
        const user = userEvent.setup();
        const options = [
            { id: 'contact-email', label: 'Email', value: 'email' },
            { id: 'contact-phone', label: 'Phone', value: 'phone', descriptor: 'Call me' },
        ];

        const { rerender } = render(
            <FormikHarness
                initialValues={{ contactMethod: '' }}
                initialTouched={{ contactMethod: true }}
                initialErrors={{ contactMethod: 'Choose a contact method' }}
            >
                <RadioButtonGroup
                    name='contactMethod'
                    id='contact-method'
                    legend='Preferred contact method'
                    inlineHelpTitle='Why we ask'
                    inlineHelp='Used for updates about your request'
                    options={options}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const group = screen.getByRole('group', { name: 'Preferred contact method' });
        expect(group).toHaveAccessibleDescription('Choose a contact method');
        expect(group).not.toHaveAttribute('role');
        expect(screen.getByText('Why we ask')).toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: /Phone\s*Call me/i }));

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"contactMethod":"phone"'));

        rerender(
            <FormikHarness initialValues={{ contactMethod: 'email' }}>
                <RadioButtonGroup
                    name='contactMethod'
                    legend='Preferred contact method'
                    options={options}
                    isSummary
                />
            </FormikHarness>,
        );

        expect(screen.getByText('Preferred contact method')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders RadioButtonGroup inline help, horizontal layout, custom class summary, and summary fallbacks', () => {
        const options = [
            { id: 'delivery-post', label: 'Post', value: 'post' },
            { id: 'delivery-pickup', label: 'Pickup', value: 'pickup' },
        ];
        const { rerender, container } = render(
            <FormikHarness initialValues={{ delivery: '' }}>
                <RadioButtonGroup
                    name='delivery'
                    legend='Delivery option'
                    inlineHelp='Choose how you want the report delivered'
                    options={options}
                    displayHorizontally
                    containerClassName='delivery-container'
                />
            </FormikHarness>,
        );

        expect(screen.getByText('Choose how you want the report delivered')).toHaveClass('contextual-help');
        expect(container.querySelector('.delivery-container')).toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ delivery: '' }}>
                <RadioButtonGroup name='delivery' legend='Delivery option' options={options} isSummary />
            </FormikHarness>,
        );

        expect(screen.queryByText('Delivery option')).not.toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ delivery: 'pickup' }}>
                <RadioButtonGroup
                    name='delivery'
                    legend='Delivery option'
                    options={options}
                    isSummary
                    containerClassName='summary-container'
                    className='summary-value'
                />
            </FormikHarness>,
        );

        expect(screen.getByText('Pickup')).toHaveClass('summary-value');

        rerender(
            <FormikHarness initialValues={{ delivery: 'courier' }}>
                <RadioButtonGroup name='delivery' legend='Delivery option' options={options} isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('Delivery option')).toBeInTheDocument();
        expect(screen.getByText('No details added')).toBeInTheDocument();
    });

    it('renders SelectInput options and calls both custom and Formik change handlers', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <FormikHarness initialValues={{ state: '' }}>
                <SelectInput
                    name='state'
                    label='State'
                    addBlank
                    defaultDisplayText='Select a state'
                    inlineHelp='Choose where the instrument is located'
                    options={[
                        { value: 'act', displayText: 'ACT' },
                        { value: 'nsw', displayText: 'NSW', disabled: true },
                    ]}
                    onChange={onChange}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const select = screen.getByRole('combobox', { name: 'State' });
        expect(select).toHaveAccessibleDescription('Choose where the instrument is located');
        expect(within(select).getByRole('option', { name: 'Select a state' })).toHaveValue('');
        expect(within(select).getByRole('option', { name: 'NSW' })).toBeDisabled();

        await user.selectOptions(select, 'act');

        expect(onChange).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"state":"act"'));
    });

    it('renders SelectInput default option, inline help details, disabled state, hidden option, and empty summary branch', async () => {
        const user = userEvent.setup();
        const options = [
            { value: 'standard', displayText: 'Standard' },
            { value: 'hidden', displayText: 'Hidden option', hidden: true, className: 'hidden-option' },
        ];
        const { rerender } = render(
            <FormikHarness initialValues={{ service: 'default' }}>
                <SelectInput
                    name='service'
                    label='Service'
                    defaultValue='default'
                    inlineHelpTitle='Service help'
                    inlineHelp='Pick the service type'
                    options={options}
                    addBlank
                    disabled
                    containerClassName='service-container'
                    className='service-select'
                />
            </FormikHarness>,
        );

        const select = screen.getByRole('combobox', { name: 'Service' });
        expect(select).toBeDisabled();
        await user.click(screen.getByText('Service help'));
        expect(screen.getByText('Pick the service type')).toBeInTheDocument();
        expect(within(select).getByRole('option', { name: 'Please select' })).toHaveValue('default');
        expect(select.querySelector('option[value="hidden"]')).toHaveAttribute('hidden');

        rerender(
            <FormikHarness initialValues={{ service: '' }}>
                <SelectInput name='service' label='Service' options={options} isSummary />
            </FormikHarness>,
        );

        expect(screen.queryByText('Service')).not.toBeInTheDocument();
    });

    it('renders SelectInput validation, read-only value, horizontal layout, and summary value', () => {
        const options = [
            { value: 'act', displayText: 'ACT' },
            { value: 'nsw', displayText: 'NSW' },
        ];
        const { rerender } = render(
            <FormikHarness
                initialValues={{ state: '' }}
                initialTouched={{ state: true }}
                initialErrors={{ state: 'Select a state' }}
            >
                <SelectInput name='state' label='State' options={options} displayHorizontally />
            </FormikHarness>,
        );

        const select = screen.getByRole('combobox', { name: 'State' });
        expect(select).toHaveAccessibleDescription('Select a state');
        expect(screen.getByText('Select a state')).toHaveClass('invalid-feedback');

        rerender(
            <FormikHarness initialValues={{ state: 'nsw' }}>
                <SelectInput name='state' label='State' options={options} readOnly />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'State' })).toHaveValue('NSW');
        expect(screen.getByRole('textbox', { name: 'State' })).toHaveAttribute('readonly');

        rerender(
            <FormikHarness initialValues={{ state: 'act' }}>
                <SelectInput name='state' label='State' options={options} isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('ACT')).toBeInTheDocument();
    });

    it('renders horizontal SelectInput details, validation, unmatched read-only value, and unmatched summary fallback', async () => {
        const user = userEvent.setup();
        const options = [
            { value: 'act', displayText: 'ACT' },
        ];
        const { rerender } = render(
            <FormikHarness
                initialValues={{ state: '' }}
                initialTouched={{ state: true }}
                initialErrors={{ state: 'Select a state' }}
            >
                <SelectInput
                    name='state'
                    label='State'
                    options={options}
                    displayHorizontally
                    inlineHelpTitle='State help'
                    inlineHelp='Choose a state'
                />
            </FormikHarness>,
        );

        await user.click(screen.getByText('State help'));
        expect(screen.getByText('Choose a state')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'State' })).toHaveAccessibleDescription('Select a state');

        rerender(
            <FormikHarness initialValues={{ state: 'unknown' }}>
                <SelectInput name='state' label='State' options={options} readOnly inlineHelpTitle='Read help' inlineHelp='Read only' />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'State' })).toHaveValue('unknown');

        rerender(
            <FormikHarness initialValues={{ state: 'unknown' }}>
                <SelectInput name='state' label='State' options={options} isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('No details added')).toBeInTheDocument();
    });

    it('uses an explicit SelectInput id for validation and supports missing options', () => {
        render(
            <FormikHarness
                initialValues={{ state: '' }}
                initialTouched={{ state: true }}
                initialErrors={{ state: 'Choose a state' }}
            >
                <SelectInput
                    name='state'
                    id='service-state'
                    label='State'
                    displayHorizontally
                    addBlank
                    options={undefined}
                />
            </FormikHarness>,
        );

        const select = screen.getByRole('combobox', { name: 'State' });
        expect(select).toHaveAttribute('aria-describedby', 'service-state-validation-msg');
        expect(screen.getByText('Choose a state')).toHaveAttribute('id', 'service-state-validation-msg');
        expect(screen.getByRole('option', { name: 'Please select' })).toBeInTheDocument();
    });

    it('updates, trims, counts, and sanitises TextAreaInput values', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ notes: 'abc' }}>
                <TextAreaInput
                    name='notes'
                    label='Notes'
                    inlineHelp='Use plain text'
                    maxCharacters={5}
                    placeholder='Add notes'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const textarea = screen.getByRole('textbox', { name: 'Notes' });
        expect(textarea).toHaveAccessibleDescription('Use plain text');
        expect(screen.getByText('3 of 5 characters used')).toHaveClass('small');

        await user.clear(textarea);
        await user.type(textarea, '  abcdef  ');
        await user.tab();

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"notes":"abcdef"'));
        expect(screen.getByTestId('touched')).toHaveTextContent('"notes":true');
        expect(screen.getByText('6 of 5 characters used')).toBeInTheDocument();

        await user.click(textarea);
        await user.clear(textarea);
        await user.paste('bad😀value');

        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"notes":"badvalue"'));
    });

    it('renders TextAreaInput validation with counter context and summary value', () => {
        const { rerender } = render(
            <FormikHarness
                initialValues={{ notes: 'abcdef' }}
                initialTouched={{ notes: true }}
                initialErrors={{ notes: 'Too long' }}
            >
                <TextAreaInput name='notes' label='Notes' maxCharacters={5} />
            </FormikHarness>,
        );

        const textarea = screen.getByRole('textbox', { name: 'Notes' });
        expect(textarea).toHaveAccessibleDescription(/Too long/i);
        expect(screen.getByText('Too long')).toHaveClass('form-validation-message');
        expect(screen.getAllByText(/6 of 5 characters used/)).toHaveLength(2);

        rerender(
            <FormikHarness initialValues={{ notes: 'Saved summary' }}>
                <TextAreaInput name='notes' label='Notes' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('Saved summary')).toBeInTheDocument();
    });

    it('renders TextAreaInput without help, rows, counter, or string trimming', async () => {
        const user = userEvent.setup();

        render(
            <FormikHarness initialValues={{ notes: null }}>
                <TextAreaInput name='notes' label='Notes' rows={6} disabled />
                <ValuesProbe />
            </FormikHarness>,
        );

        const textarea = screen.getByRole('textbox', { name: 'Notes' });
        expect(textarea).toBeDisabled();
        expect(textarea).toHaveAttribute('rows', '6');
        expect(screen.queryByText(/characters used/)).not.toBeInTheDocument();

        await user.tab();
        expect(screen.getByTestId('touched')).toHaveTextContent('{}');
    });

    it('handles TextInput labels, events, blur trimming, date formatting, and summary dates', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onBlur = vi.fn();
        const onKeyDown = vi.fn();
        const onClick = vi.fn();
        const onFocus = vi.fn();

        const { rerender } = render(
            <FormikHarness initialValues={{ firstName: '  Alex  ' }}>
                <TextInput
                    name='firstName'
                    label='First name'
                    inlineHelpTitle='Name help'
                    inlineHelp='Enter your legal name'
                    onChange={onChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    onClick={onClick}
                    onFocus={onFocus}
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const input = screen.getByRole('textbox', { name: 'First name' });
        expect(screen.getByText('Name help')).toBeInTheDocument();

        await user.click(input);
        await user.keyboard('a');
        await user.clear(input);
        await user.type(input, '  Jordan  ');
        await user.tab();

        expect(onClick).toHaveBeenCalled();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onKeyDown).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalled();
        expect(onBlur).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.getByTestId('values')).toHaveTextContent('"firstName":"Jordan"'));

        rerender(
            <FormikHarness initialValues={{ dueDate: '2026-06-11T00:00:00.000Z' }}>
                <TextInput name='dueDate' label='Due date' type='date' />
            </FormikHarness>,
        );

        expect(screen.getByLabelText('Due date')).toHaveValue('2026-06-11');

        rerender(
            <FormikHarness initialValues={{ dueDate: '2026-06-11T00:00:00.000Z' }}>
                <TextInput name='dueDate' label='Due date' type='date' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('11/06/2026')).toBeInTheDocument();
    });

    it('renders TextInput validation and disabled/read-only states', () => {
        render(
            <FormikHarness
                initialValues={{ firstName: '' }}
                initialTouched={{ firstName: true }}
                initialErrors={{ firstName: 'First name is required' }}
            >
                <TextInput name='firstName' label='First name' disabled readonly />
            </FormikHarness>,
        );

        const input = screen.getByRole('textbox', { name: 'First name' });
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute('readonly');
        expect(input).toHaveAccessibleDescription('First name is required');
        expect(screen.getByText('First name is required')).toHaveClass('form-validation-message');
    });

    it('renders TextInput defaults, aria passthrough, date blur formatting, and summary fallback', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <FormikHarness initialValues={{ dueDate: '2026-06-11T00:00:00.000Z' }}>
                <TextInput
                    name='dueDate'
                    label='Due date'
                    type='date'
                    role='combobox'
                    aria-expanded={false}
                    aria-controls='due-date-options'
                />
                <ValuesProbe />
            </FormikHarness>,
        );

        const input = screen.getByRole('combobox', { name: 'Due date' });
        expect(input).toHaveAttribute('aria-controls', 'due-date-options');
        expect(input).toHaveAttribute('placeholder', 'dd/mm/yyyy');

        await user.click(input);
        await user.tab();

        await waitFor(() => expect(screen.getByTestId('touched')).toHaveTextContent('"dueDate":true'));

        rerender(
            <FormikHarness initialValues={{ dueDate: '' }}>
                <TextInput name='dueDate' label='Due date' type='date' isSummary />
            </FormikHarness>,
        );

        expect(screen.getByText('No details added')).toBeInTheDocument();
    });

    it('renders TextReadOnly supplied and Formik values plus summary formatting', () => {
        const { rerender } = render(
            <FormikHarness initialValues={{ reference: 'FORMIK-REF' }}>
                <TextReadOnly
                    name='reference'
                    label='Reference'
                    value='SUPPLIED-REF'
                    inlineHelp='Generated by NMI'
                />
            </FormikHarness>,
        );

        const supplied = screen.getByRole('textbox', { name: 'Reference' });
        expect(supplied).toHaveValue('SUPPLIED-REF');
        expect(supplied).toHaveAttribute('readonly');
        expect(screen.getByText('Generated by NMI')).toBeInTheDocument();

        rerender(
            <FormikHarness initialValues={{ reference: 'FORMIK-REF' }}>
                <TextReadOnly name='reference' label='Reference' />
            </FormikHarness>,
        );

        expect(screen.getByRole('textbox', { name: 'Reference' })).toHaveValue('FORMIK-REF');

        rerender(
            <FormikHarness initialValues={{ reference: '123456' }}>
                <TextReadOnly name='reference' label='Reference' isSummary format='##-##-##' />
            </FormikHarness>,
        );

        expect(screen.getByText('Reference')).toBeInTheDocument();
        expect(screen.getByText('12-34-56')).toBeInTheDocument();
    });
});
