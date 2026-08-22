import type { Meta, StoryObj } from '@storybook/react-vite';
import TextInput from './TextInput';
import SelectInput from './SelectInput';
import Checkbox from './Checkbox';
import NumberInput from './NumberInput';
import TextAreaInput from './TextAreaInput';
import RadioButtonGroup from './RadioButtonGroup';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
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
                    requirements: 'Calibrate at standard operating points and return with certificate.',
                    contactOption: 'same',
                },
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommonFieldSet: Story = {
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
                    { id: 'contact-same', label: 'Use the request contact', value: 'same' },
                    { id: 'contact-different', label: 'Use a different contact', value: 'different' },
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
};
