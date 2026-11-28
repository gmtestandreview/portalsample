import preview from '../../../../.storybook/preview';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { expect, userEvent, within } from 'storybook/test';
import RhfTextInput from '../Inputs/RhfTextInput';
import RhfSelectInput from '../Inputs/RhfSelectInput';
import RhfRadioButtonGroup from '../Inputs/RhfRadioButtonGroup';
import RhfDatePicker from '../Inputs/RhfDatePicker';
import RhfTextAreaInput from '../Inputs/RhfTextAreaInput';
import RhfCheckbox from '../Inputs/RhfCheckbox';

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

const emptyInitialValues: Record<string, unknown> = {};

const RhfStoryForm = ({
  children,
  initialValues = emptyInitialValues,
}: {
  children: ReactNode;
  initialValues?: Record<string, unknown>;
}) => {
  const methods = useForm({ defaultValues: initialValues });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

const meta = preview.meta({
  title: 'Forms/Inputs',
  parameters: { layout: 'padded' },
});

export const AllInputsShowcase = meta.story({
  render: () => (
    <RhfStoryForm
      initialValues={{
        firstName: '',
        lastName: '',
        state: '',
        yesNo: '',
        dateOfBirth: '',
        notes: '',
        agree: false,
      }}
    >
      <h2 className='h4 mb-4'>Form input primitives</h2>
      <RhfTextInput
        name='firstName'
        label='First name'
        placeholder='Enter first name'
      />
      <RhfTextInput
        name='lastName'
        label='Last name'
        placeholder='Enter last name'
      />
      <RhfSelectInput
        name='state'
        label='State or territory'
        options={stateOptions}
        addBlank
        defaultDisplayText='Please select a state'
      />
      <RhfRadioButtonGroup<string>
        name='yesNo'
        legend='Has this instrument been calibrated before?'
        options={yesNoOptions}
        displayHorizontally
      />
      <RhfDatePicker
        name='dateOfBirth'
        label='Date of birth'
        placeholder='dd/mm/yyyy'
        calendarButtonTitle='Open calendar'
      />
      <RhfTextAreaInput name='notes' label='Additional notes' />
      <RhfCheckbox name='agree' label='I agree to the terms and conditions' />
    </RhfStoryForm>
  ),
});

export const TextInputDefault = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ name: '' }}>
      <RhfTextInput
        name='name'
        label='Organisation name'
        placeholder='Enter name'
      />
    </RhfStoryForm>
  ),
});

export const TextInputWithHelp = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ abn: '' }}>
      <RhfTextInput
        name='abn'
        label='ABN'
        inlineHelp='Your 11-digit Australian Business Number as registered with the ATO.'
        placeholder='00 000 000 000'
      />
    </RhfStoryForm>
  ),
});

export const TextInputWithExpandableHelp = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ serialNumber: '' }}>
      <RhfTextInput
        name='serialNumber'
        label='Serial number'
        inlineHelpTitle='Where to find the serial number'
        inlineHelp='The serial number is printed on the identification plate attached to the instrument, usually on the rear or side panel.'
        placeholder='e.g. SN123456'
      />
    </RhfStoryForm>
  ),
});

export const TextInputDisabled = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ email: 'user@example.com' }}>
      <RhfTextInput name='email' label='Email address' disabled />
    </RhfStoryForm>
  ),
  play: async ({ canvas }) => {
    const email = canvas.getByLabelText('Email address');

    await expect(email).toBeDisabled();
    await expect(email).toHaveValue('user@example.com');
  },
});

export const TextInputReadOnly = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ referenceId: 'RFQ-2024-001234' }}>
      <RhfTextInput name='referenceId' label='Reference ID' readonly />
    </RhfStoryForm>
  ),
  play: async ({ canvas }) => {
    const reference = canvas.getByLabelText('Reference ID');

    await expect(reference).toHaveAttribute('readonly');
    await expect(reference).toHaveValue('RFQ-2024-001234');
  },
});

export const SelectInputDefault = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ state: '' }}>
      <RhfSelectInput
        name='state'
        label='State or territory'
        options={stateOptions}
        addBlank
        defaultDisplayText='Please select a state'
      />
    </RhfStoryForm>
  ),
});

export const SelectInputHorizontal = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ state: 'VIC' }}>
      <RhfSelectInput
        name='state'
        label='State or territory'
        options={stateOptions}
      />
    </RhfStoryForm>
  ),
});

export const RadioButtonGroupVertical = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ hasInstrument: '' }}>
      <RhfRadioButtonGroup<string>
        name='hasInstrument'
        legend='Are you submitting an instrument for calibration?'
        options={yesNoOptions}
      />
    </RhfStoryForm>
  ),
});

export const RadioButtonGroupHorizontal = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ hasInstrument: 'Yes' }}>
      <RhfRadioButtonGroup<string>
        name='hasInstrument'
        legend='Are you submitting an instrument for calibration?'
        options={yesNoOptions}
        displayHorizontally
      />
    </RhfStoryForm>
  ),
});

export const DatePickerDefault = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ dateRequired: '' }}>
      <RhfDatePicker
        name='dateRequired'
        label='Date required'
        placeholder='dd/mm/yyyy'
        calendarButtonTitle='Open calendar'
      />
    </RhfStoryForm>
  ),
});

export const TextAreaDefault = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ description: '' }}>
      <RhfTextAreaInput name='description' label='Description' />
    </RhfStoryForm>
  ),
});

export const CheckboxDefault = meta.story({
  render: () => (
    <RhfStoryForm initialValues={{ agree: false }}>
      <RhfCheckbox
        name='agree'
        label='I agree to the terms and conditions of the NMI Services portal.'
      />
    </RhfStoryForm>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await expect(
      canvas.getByLabelText(
        'I agree to the terms and conditions of the NMI Services portal.',
      ),
    ).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    await expect(checkbox).toBeChecked();
  },
});
