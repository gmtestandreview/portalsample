import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Formik, Form } from 'formik';
import { expect, userEvent, within } from 'storybook/test';
import TextInput from '../Inputs/TextInput';
import SelectInput from '../Inputs/SelectInput';
import RadioButtonGroup from '../Inputs/RadioButtonGroup';
import DatePicker from '../Inputs/DatePicker';
import TextAreaInput from '../Inputs/TextAreaInput';
import Checkbox from '../Inputs/Checkbox';

const stateOptions = [
    { value: 'NSW', displayText: 'New South Wales' },
    { value: 'VIC', displayText: 'Victoria' },
    { value: 'QLD', displayText: 'Queensland' },
    { value: 'SA', displayText: 'South Australia' },
    { value: 'WA', displayText: 'Western Australia' },
    { value: 'TAS', displayText: 'Tasmania' },
    { value: 'ACT', displayText: 'Australian Capital Territory' },
    { value: 'NT', displayText: 'Northern Territory' },
];

const yesNoOptions = [
    { id: 'yesno-yes', value: 'Yes', label: 'Yes' },
    { id: 'yesno-no', value: 'No', label: 'No' },
];

const FormikWrapper = ({ children, initialValues = {} }: { children: ReactNode; initialValues?: Record<string, unknown> }) => (
    <Formik
        initialValues={initialValues}
        onSubmit={() => {}}
    >
        <Form>
            {children}
        </Form>
    </Formik>
);

const meta = {
    title: 'Forms/Inputs',
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllInputsShowcase: Story = {
    render: () => (
        <FormikWrapper initialValues={{ firstName: '', lastName: '', state: '', yesNo: '', dateOfBirth: '', notes: '', agree: false }}>
            <h2 className='h4 mb-4'>Form input primitives</h2>
            <TextInput name='firstName' label='First name' placeholder='Enter first name' />
            <TextInput name='lastName' label='Last name' placeholder='Enter last name' />
            <SelectInput<string>
                name='state'
                label='State or territory'
                options={stateOptions}
                addBlank
                defaultDisplayText='Please select a state'
            />
            <RadioButtonGroup<string>
                name='yesNo'
                legend='Has this instrument been calibrated before?'
                options={yesNoOptions}
                displayHorizontally
            />
            <DatePicker
                name='dateOfBirth'
                label='Date of birth'
                placeholder='dd/mm/yyyy'
                calendarButtonTitle='Open calendar'
            />
            <TextAreaInput name='notes' label='Additional notes' />
            <Checkbox name='agree' label='I agree to the terms and conditions' />
        </FormikWrapper>
    ),
};

export const TextInputDefault: Story = {
    render: () => (
        <FormikWrapper initialValues={{ name: '' }}>
            <TextInput name='name' label='Organisation name' placeholder='Enter name' />
        </FormikWrapper>
    ),
};

export const TextInputWithHelp: Story = {
    render: () => (
        <FormikWrapper initialValues={{ abn: '' }}>
            <TextInput
                name='abn'
                label='ABN'
                inlineHelp='Your 11-digit Australian Business Number as registered with the ATO.'
                placeholder='00 000 000 000'
            />
        </FormikWrapper>
    ),
};

export const TextInputWithExpandableHelp: Story = {
    render: () => (
        <FormikWrapper initialValues={{ serialNumber: '' }}>
            <TextInput
                name='serialNumber'
                label='Serial number'
                inlineHelpTitle='Where to find the serial number'
                inlineHelp='The serial number is printed on the identification plate attached to the instrument, usually on the rear or side panel.'
                placeholder='e.g. SN123456'
            />
        </FormikWrapper>
    ),
};

export const TextInputDisabled: Story = {
    render: () => (
        <FormikWrapper initialValues={{ email: 'user@example.com' }}>
            <TextInput name='email' label='Email address' disabled type='email' />
        </FormikWrapper>
    ),
};

export const TextInputReadOnly: Story = {
    render: () => (
        <FormikWrapper initialValues={{ referenceId: 'RFQ-2024-001234' }}>
            <TextInput name='referenceId' label='Reference ID' readonly />
        </FormikWrapper>
    ),
};

export const SelectInputDefault: Story = {
    render: () => (
        <FormikWrapper initialValues={{ state: '' }}>
            <SelectInput<string>
                name='state'
                label='State or territory'
                options={stateOptions}
                addBlank
                defaultDisplayText='Please select a state'
            />
        </FormikWrapper>
    ),
};

export const SelectInputHorizontal: Story = {
    render: () => (
        <FormikWrapper initialValues={{ state: 'VIC' }}>
            <SelectInput<string>
                name='state'
                label='State or territory'
                options={stateOptions}
                displayHorizontally
            />
        </FormikWrapper>
    ),
};

export const RadioButtonGroupVertical: Story = {
    render: () => (
        <FormikWrapper initialValues={{ hasInstrument: '' }}>
            <RadioButtonGroup<string>
                name='hasInstrument'
                legend='Are you submitting an instrument for calibration?'
                options={yesNoOptions}
            />
        </FormikWrapper>
    ),
};

export const RadioButtonGroupHorizontal: Story = {
    render: () => (
        <FormikWrapper initialValues={{ hasInstrument: 'Yes' }}>
            <RadioButtonGroup<string>
                name='hasInstrument'
                legend='Are you submitting an instrument for calibration?'
                options={yesNoOptions}
                displayHorizontally
            />
        </FormikWrapper>
    ),
};

export const DatePickerDefault: Story = {
    render: () => (
        <FormikWrapper initialValues={{ dateRequired: '' }}>
            <DatePicker
                name='dateRequired'
                label='Date required'
                placeholder='dd/mm/yyyy'
                calendarButtonTitle='Open calendar'
            />
        </FormikWrapper>
    ),
};

export const TextAreaDefault: Story = {
    render: () => (
        <FormikWrapper initialValues={{ description: '' }}>
            <TextAreaInput name='description' label='Description' />
        </FormikWrapper>
    ),
};

export const CheckboxDefault: Story = {
    render: () => (
        <FormikWrapper initialValues={{ agree: false }}>
            <Checkbox name='agree' label='I agree to the terms and conditions of the NMI Services portal.' />
        </FormikWrapper>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox');
        await expect(checkbox).not.toBeChecked();
        await userEvent.click(checkbox);
        await expect(checkbox).toBeChecked();
    },
};
