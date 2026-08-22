import {
    act, fireEvent, render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';
import Checkbox from '@/components/Inputs/Checkbox';
import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';
import NumberInput from '@/components/Inputs/NumberInput';
import RadioButtonGroup from '@/components/Inputs/RadioButtonGroup';
import SelectInput from '@/components/Inputs/SelectInput';
import TextAreaInput from '@/components/Inputs/TextAreaInput';
import TextInput from '@/components/Inputs/TextInput';

interface HarnessProps {
    readonly children: React.ReactNode;
    readonly initialValues: Record<string, unknown>;
    readonly initialErrors?: Record<string, string>;
    readonly initialTouched?: Record<string, boolean>;
}

function Harness({
    children,
    initialValues,
    initialErrors,
    initialTouched,
}: HarnessProps) {
    return (
        <Formik
            initialValues={initialValues}
            initialErrors={initialErrors}
            initialTouched={initialTouched}
            onSubmit={vi.fn()}
        >
            <Form>{children}</Form>
        </Formik>
    );
}

describe('residual input branches', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders SelectInput horizontal plain help without validation', () => {
        render(
            <Harness initialValues={{ state: '' }}>
                <SelectInput
                    name='state'
                    label='State'
                    displayHorizontally
                    inlineHelp='Choose the service state'
                    options={[]}
                />
            </Harness>,
        );

        expect(screen.getByRole('combobox', { name: 'State' })).toHaveAccessibleDescription('Choose the service state');
        expect(screen.queryByText(/validation/i)).not.toBeInTheDocument();
    });

    it('covers SelectInput partial validation states in both layouts', () => {
        const { rerender } = render(
            <Harness initialValues={{ state: '' }} initialTouched={{ state: true }}>
                <SelectInput name='state' label='State' options={[]} />
            </Harness>,
        );

        expect(screen.getByRole('combobox', { name: 'State' })).not.toHaveAttribute('aria-invalid', 'true');

        rerender(
            <Harness initialValues={{ state: '' }} initialErrors={{ state: 'Choose a state' }}>
                <SelectInput name='state' label='State' displayHorizontally options={[]} />
            </Harness>,
        );

        expect(screen.queryByText('Choose a state')).not.toBeInTheDocument();
    });

    it('uses field-name validation ids for SelectInput and RadioButtonGroup', () => {
        render(
            <Harness
                initialValues={{ state: '', delivery: '' }}
                initialErrors={{ state: 'Choose a state', delivery: 'Choose delivery' }}
                initialTouched={{ state: true, delivery: true }}
            >
                <SelectInput name='state' label='State' options={[]} />
                <RadioButtonGroup
                    name='delivery'
                    legend='Delivery'
                    options={[{ id: 'post', label: 'Post', value: 'post' }]}
                />
            </Harness>,
        );

        expect(screen.getByRole('combobox', { name: 'State' })).toHaveAttribute('aria-describedby', 'state-validation-msg');
        expect(screen.getByRole('group', { name: 'Delivery' })).toHaveAttribute('aria-describedby', 'delivery-validation-msg');
    });

    it('uses the NumberInput field name for pattern validation feedback', () => {
        render(
            <Harness
                initialValues={{ phone: '' }}
                initialErrors={{ phone: 'Enter a phone number' }}
                initialTouched={{ phone: true }}
            >
                <NumberInput name='phone' label='Phone' format='checkPhoneFormat' />
            </Harness>,
        );

        expect(screen.getByRole('textbox', { name: 'Phone' }))
            .toHaveAttribute('aria-describedby', 'phone-validation-msg');
    });

    it('renders the false Checkbox summary value', () => {
        render(
            <Harness initialValues={{ accepted: false }}>
                <Checkbox name='accepted' label='Accepted' isSummary />
            </Harness>,
        );

        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders SelectInput summary values when the selected option value is zero', () => {
        render(
            <Harness initialValues={{ priority: 0 }}>
                <SelectInput
                    name='priority'
                    label='Priority'
                    isSummary
                    options={[
                        { displayText: 'Zero priority', value: 0 },
                        { displayText: 'High priority', value: 1 },
                    ]}
                />
            </Harness>,
        );

        expect(screen.getByText('Zero priority')).toBeInTheDocument();
    });

    it('handles non-string TextAreaInput and Date-valued TextInput fields', () => {
        render(
            <Harness initialValues={{ notes: 42, date: new Date('2026-06-13T00:00:00.000Z') }}>
                <TextAreaInput name='notes' label='Notes' />
                <TextInput name='date' label='Date' type='date' />
            </Harness>,
        );

        expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('42');
        expect(screen.getByLabelText('Date')).toHaveValue('2026-06-13');
    });

    it('keeps AutoSuggest keyboard movement inert while closed and uses fallback ids', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(
            <Harness
                initialValues={{ suburb: '' }}
                initialErrors={{ suburb: 'Choose a suburb' }}
                initialTouched={{ suburb: true }}
            >
                <AutoSuggestContainer
                    name='suburb'
                    label='Suburb'
                    options={[]}
                    searchTerm={null}
                    onSearchTermChange={vi.fn()}
                    onSelectedOption={vi.fn()}
                    onCancel={onCancel}
                />
            </Harness>,
        );

        const input = screen.getByRole('combobox', { name: 'Suburb' });
        input.focus();
        await user.keyboard('{ArrowDown}{ArrowUp}');

        expect(input).toHaveValue('');
        expect(input).toHaveAttribute('aria-describedby', 'suburb-validation-msg');
        expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('focuses the first AutoSuggest option when ArrowUp opens the popup', async () => {
        const user = userEvent.setup();
        render(
            <Harness initialValues={{ suburb: '' }}>
                <AutoSuggestContainer
                    name='suburb'
                    label='Suburb'
                    options={[{ id: 'one', displayText: 'One', value: 'one' }]}
                    searchTerm=''
                    onSearchTermChange={vi.fn()}
                    onSelectedOption={vi.fn()}
                    onCancel={vi.fn()}
                />
            </Harness>,
        );

        const input = screen.getByRole('combobox', { name: 'Suburb' });
        input.focus();
        await user.keyboard('{ArrowUp}');
        expect(input).toHaveAttribute(
            'aria-activedescendant',
            'suburb-options-option-one',
        );
    });

    it('uses OrganisationNameLookup fallback options, explicit help id, Escape, and validation', async () => {
        vi.useFakeTimers();
        const firstRender = render(
            <Harness
                initialValues={{ organisationName: '', orgNameOptions: undefined }}
                initialErrors={{ organisationName: 'Choose an organisation' }}
                initialTouched={{ organisationName: true }}
            >
                <OrganisationNameLookup
                    id='organisation-control'
                    name='organisationName'
                    inlineHelp='Start typing'
                    optionsFieldName='name'
                />
            </Harness>,
        );

        expect(screen.getByRole('combobox', { name: 'Organisation name' }))
            .toHaveAttribute('aria-describedby', 'organisation-control-validation-msg');

        firstRender.unmount();
        render(
            <Harness initialValues={{
                organisationName: '',
                orgNameOptions: [{ name: 'National Measurement Institute' }],
            }}>
                <OrganisationNameLookup
                    id='organisation-control'
                    name='organisationName'
                    inlineHelp='Start typing'
                    optionsFieldName='name'
                />
            </Harness>,
        );

        const input = screen.getByRole('combobox', { name: 'Organisation name' });
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Na' } });
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(screen.getByRole('listbox', { name: 'Suggested options' })).toBeInTheDocument();
        act(() => {
            fireEvent.keyDown(input, { key: 'Escape' });
        });
        expect(screen.queryByRole('listbox', { name: 'Suggested options' })).not.toBeInTheDocument();
    });

    it('uses OrganisationNameLookup name-based help and validation ids and ignores other keys', async () => {
        vi.useFakeTimers();
        const { unmount } = render(
            <Harness
                initialValues={{ organisationName: '', orgNameOptions: undefined }}
                initialErrors={{ organisationName: 'Choose an organisation' }}
                initialTouched={{ organisationName: true }}
            >
                <OrganisationNameLookup
                    name='organisationName'
                    inlineHelp='Start typing'
                    optionsFieldName='name'
                />
            </Harness>,
        );

        const input = screen.getByRole('combobox', { name: 'Organisation name' });
        expect(input).toHaveAttribute('aria-describedby', 'organisationName-validation-msg');
        act(() => {
            fireEvent.change(input, { target: { value: 'Na' } });
            vi.advanceTimersByTime(300);
        });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        unmount();

        render(
            <Harness initialValues={{
                organisationName: '',
                orgNameOptions: [{ name: 'National Measurement Institute' }],
            }}>
                <OrganisationNameLookup name='organisationName' optionsFieldName='name' />
            </Harness>,
        );
        const populatedInput = screen.getByRole('combobox', { name: 'Organisation name' });
        await act(async () => {
            fireEvent.change(populatedInput, { target: { value: 'Na' } });
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        act(() => {
            fireEvent.keyDown(populatedInput, { key: 'PageDown' });
        });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
});
