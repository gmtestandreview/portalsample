import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container, Row, Col } from 'react-bootstrap';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import WizardForm from './index';
import WizardStep from './WizardStep';
import TextInput from '../../Inputs/TextInput';
import SelectInput from '../../Inputs/SelectInput';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';

const twoStepStatuses: FormStepStatusDto[] = [
    { status: FormStepStatus.NotStarted },
    { status: FormStepStatus.NotStarted },
];

const threeStepStatuses: FormStepStatusDto[] = [
    { status: FormStepStatus.Completed },
    { status: FormStepStatus.Completed },
    { status: FormStepStatus.NotStarted },
];

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

const meta = {
    title: 'Forms/WizardForm',
    parameters: { layout: 'fullscreen' },
    decorators: [withPortalProviders],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1ContactDetails: Story = {
    parameters: { portal: { initialEntries: ['/step-1'] } },
    render: () => (
        <WizardForm
            locationOnCompletion='/dashboard'
            locationAfterExit='/dashboard'
            nextButtonTitle='Save and next'
            lastStepNextButtonTitle='Submit'
            previousButtonTitle='Back'
            canSaveDraft
            showSaveAndNextButton
            showBanner
            bannerTitle='Create account'
        >
            <WizardStep<{ firstName: string; lastName: string; email: string }>
                title='Contact details'
                location='/step-1'
                initialValues={{ firstName: '', lastName: '', email: '' }}
                stepStatuses={twoStepStatuses}
                loadStepValues={async () => ({
                    stepValues: { firstName: '', lastName: '', email: '' },
                })}
                bannerTitle='Create account'
            >
                <TextInput name='firstName' label='First name' />
                <TextInput name='lastName' label='Last name' />
                <TextInput name='email' label='Email address' type='email' />
            </WizardStep>
            <WizardStep<{ comments: string }>
                title='Review and submit'
                location='/step-2'
                initialValues={{ comments: '' }}
                isSummaryPage
                stepStatuses={twoStepStatuses}
                loadStepValues={async () => ({ stepValues: { comments: '' } })}
                bannerTitle='Create account'
            >
                <p>Review your details and submit your account creation request.</p>
            </WizardStep>
        </WizardForm>
    ),
};

export const Step2WithPreviousCompleted: Story = {
    parameters: { portal: { initialEntries: ['/step-2'] } },
    render: () => (
        <WizardForm
            locationOnCompletion='/dashboard'
            locationAfterExit='/dashboard'
            nextButtonTitle='Save and next'
            lastStepNextButtonTitle='Submit'
            previousButtonTitle='Back'
            canSaveDraft
            showSaveAndNextButton
            showBanner
        >
            <WizardStep<{ firstName: string; lastName: string }>
                title='Contact details'
                location='/step-1'
                initialValues={{ firstName: 'Test', lastName: 'User' }}
                stepStatuses={[
                    { status: FormStepStatus.Completed },
                    { status: FormStepStatus.NotStarted },
                ]}
                loadStepValues={async () => ({
                    stepValues: { firstName: 'Test', lastName: 'User' },
                })}
                bannerTitle='Instrument details'
            >
                <TextInput name='firstName' label='First name' />
                <TextInput name='lastName' label='Last name' />
            </WizardStep>
            <WizardStep<{ state: string; notes: string }>
                title='Organisation details'
                location='/step-2'
                initialValues={{ state: '', notes: '' }}
                stepStatuses={[
                    { status: FormStepStatus.Completed },
                    { status: FormStepStatus.NotStarted },
                ]}
                loadStepValues={async () => ({
                    stepValues: { state: '', notes: '' },
                })}
                bannerTitle='Instrument details'
            >
                <SelectInput<string>
                    name='state'
                    label='State or territory'
                    options={stateOptions}
                    addBlank
                />
                <TextInput name='notes' label='Additional notes' />
            </WizardStep>
        </WizardForm>
    ),
};

export const ThreeStepSummaryPage: Story = {
    parameters: { portal: { initialEntries: ['/step-3'] } },
    render: () => (
        <WizardForm
            locationOnCompletion='/dashboard'
            locationAfterExit='/dashboard'
            lastStepNextButtonTitle='Submit request'
            previousButtonTitle='Back'
            canSaveDraft={false}
            showSaveAndNextButton
            showBanner
        >
            <WizardStep<{ manufacturer: string }>
                title='Instrument details'
                location='/step-1'
                initialValues={{ manufacturer: 'Fluke' }}
                stepStatuses={threeStepStatuses}
                loadStepValues={async () => ({ stepValues: { manufacturer: 'Fluke' } })}
                bannerTitle='Request for quote'
            >
                <TextInput name='manufacturer' label='Manufacturer' />
            </WizardStep>
            <WizardStep<{ deliveryDate: string }>
                title='Delivery'
                location='/step-2'
                initialValues={{ deliveryDate: '' }}
                stepStatuses={threeStepStatuses}
                loadStepValues={async () => ({ stepValues: { deliveryDate: '' } })}
                bannerTitle='Request for quote'
            >
                <TextInput name='deliveryDate' label='Delivery date' type='date' />
            </WizardStep>
            <WizardStep<Record<string, never>>
                title='Summary'
                location='/step-3'
                initialValues={{}}
                isSummaryPage
                stepStatuses={threeStepStatuses}
                loadStepValues={async () => ({ stepValues: {} })}
                bannerTitle='Request for quote'
            >
                <Container>
                    <Row>
                        <Col>
                            <h2>Review your request</h2>
                            <p>Manufacturer: <strong>Fluke</strong></p>
                        </Col>
                    </Row>
                </Container>
            </WizardStep>
        </WizardForm>
    ),
};
