import preview from '../../../../.storybook/preview';
import { expect } from 'storybook/test';
import TextInput from './TextInput';
import SelectInput from './SelectInput';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import TextAreaInput from './TextAreaInput';
import RadioButtonGroup from './RadioButtonGroup';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Components/Inputs',
  component: TextInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      formik: {
        initialValues: {
          organisationName: 'Storybook Organisation',
          measurementCategory: 'electrical',
          includeCertificate: true,
          quantity: '3',
          requirements:
            'Calibrate at standard operating points and return with certificate.',
          contactOption: 'same',
        },
      },
    },
  },
});

export const CommonFieldSet = meta.story({
  args: {
    label: 'Organisation name',
    name: 'organisationName',
  },
  render: () => (
    <div style={{ minWidth: 720 }}>
      <TextInput
        label='Organisation name'
        name='organisationName'
        inlineHelp='Used on quotations and measurement reports.'
      />
      <SelectInput
        name='measurementCategory'
        label='Measurement category'
        options={[
          { displayText: 'Electrical', value: 'electrical' },
          { displayText: 'Mass', value: 'mass' },
          { displayText: 'Temperature', value: 'temperature' },
        ]}
      />
      <RadioButtonGroup
        legend='Invoice contact'
        name='contactOption'
        id='invoice-contact-option'
        options={[
          {
            id: 'contact-same',
            label: 'Use the request contact',
            value: 'same',
          },
          {
            id: 'contact-different',
            label: 'Use a different contact',
            value: 'different',
          },
        ]}
      />
      <Checkbox
        label='Include measurement certificate'
        name='includeCertificate'
      />
      <NumberInput
        label='Number of items'
        name='quantity'
        decimalScale={0}
        allowNegative={false}
      />
      <TextAreaInput
        label='Testing/calibration requirements'
        name='requirements'
        rows={4}
        maxCharacters={2000}
      />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const organisationName = canvas.getByLabelText('Organisation name');

    await expect(organisationName).toHaveValue('Storybook Organisation');

    await userEvent.clear(organisationName);
    await userEvent.type(organisationName, 'Updated Organisation');

    await expect(organisationName).toHaveValue('Updated Organisation');

    const category = canvas.getByLabelText('Measurement category');

    await expect(category).toHaveValue('electrical');

    await userEvent.selectOptions(category, 'mass');

    await expect(category).toHaveValue('mass');

    const differentContact = canvas.getByRole('radio', {
      name: 'Use a different contact',
    });
    await userEvent.click(differentContact);

    await expect(differentContact).toBeChecked();

    const certificate = canvas.getByRole('checkbox', {
      name: 'Include measurement certificate',
    });

    await expect(certificate).toBeChecked();

    await userEvent.click(certificate);

    await expect(certificate).not.toBeChecked();

    const quantity = canvas.getByLabelText('Number of items');

    await expect(quantity).toHaveValue('3');

    await userEvent.clear(quantity);
    await userEvent.type(quantity, '5');

    await expect(quantity).toHaveValue('5');

    const requirements = canvas.getByLabelText(
      'Testing/calibration requirements',
    );
    await userEvent.clear(requirements);
    await userEvent.type(requirements, 'Calibrate at five operating points.');

    await expect(requirements).toHaveValue(
      'Calibrate at five operating points.',
    );
  },
});
