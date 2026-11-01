import preview from '../../../../../.storybook/preview';
import { within, expect, fn, waitFor } from 'storybook/test';
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

const WizardCompleteDestination = () => <p>Wizard completed</p>;

const meta = preview.meta({
  title: 'Forms/WizardForm',
  parameters: { layout: 'fullscreen' },
  decorators: [withPortalProviders],
});

export const Step1ContactDetails = meta.story({
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
        loadStepValues={() => ({
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
        loadStepValues={() => ({ stepValues: { comments: '' } })}
        bannerTitle='Create account'
      >
        <p>Review your details and submit your account creation request.</p>
      </WizardStep>
    </WizardForm>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Progress is announced once, by the stepper. The h1 used to repeat it as a
    // visually-hidden "Step 1 of 2", which duplicated the same information for screen
    // reader users now that the stepper is no longer aria-hidden.
    const heading = canvas.getByRole('heading', { level: 1 });

    await expect(heading).toHaveTextContent('Contact details');
    await expect(heading).not.toHaveTextContent(/Step \d+ of \d+/);
    await expect(
      canvas.getByRole('list', { name: 'Form progress' }),
    ).toBeVisible();
  },
});

export const Step2WithPreviousCompleted = meta.story({
  parameters: {
    portal: {
      initialEntries: ['/step-2'],
      destinationRoutes: [
        { path: '/dashboard', element: <WizardCompleteDestination /> },
      ],
    },
  },
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
        loadStepValues={() => ({
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
        loadStepValues={() => ({
          stepValues: { state: '', notes: '' },
        })}
        onSaveAndNext={() => undefined}
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
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Organisation details' }),
    ).toBeVisible();

    const state = canvas.getByRole('combobox', {
      name: 'State or territory',
    });
    await userEvent.selectOptions(state, 'ACT');

    await expect(state).toHaveValue('ACT');

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    await expect(await canvas.findByText('Wizard completed')).toBeVisible();
  },
});

export const ThreeStepSummaryPage = meta.story({
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
        loadStepValues={() => ({ stepValues: { manufacturer: 'Fluke' } })}
        bannerTitle='Request for quote'
      >
        <TextInput name='manufacturer' label='Manufacturer' />
      </WizardStep>
      <WizardStep<{ deliveryDate: string }>
        title='Delivery'
        location='/step-2'
        initialValues={{ deliveryDate: '' }}
        stepStatuses={threeStepStatuses}
        loadStepValues={() => ({ stepValues: { deliveryDate: '' } })}
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
        loadStepValues={() => ({ stepValues: {} })}
        bannerTitle='Request for quote'
      >
        <Container>
          <Row>
            <Col>
              <h2>Review your request</h2>
              <p>
                Manufacturer: <strong>Fluke</strong>
              </p>
            </Col>
          </Row>
        </Container>
      </WizardStep>
    </WizardForm>
  ),
});

const onSaveAndExit = fn();

const pendingSave = { finish: (): void => undefined };

const startPendingSave = (): Promise<void> =>
  new Promise<void>((resolve) => {
    pendingSave.finish = resolve;
  });

const onSaveAndNext = fn();

const exitDestinations = [
  { path: '/exited', element: <p>Exited to dashboard</p> },
  { path: '/dashboard', element: <WizardCompleteDestination /> },
];

const requireFirstName = (values: { firstName?: string }) =>
  values.firstName ? {} : { firstName: 'Enter your first name' };

interface SaveWizardProps {
  readonly onExit?: () => Promise<void>;
  readonly validateHard?: typeof requireFirstName;
}

const SaveWizard = ({ onExit, validateHard }: SaveWizardProps) => (
  <WizardForm
    locationOnCompletion='/dashboard'
    locationAfterExit='/exited'
    nextButtonTitle='Save and next'
    lastStepNextButtonTitle='Submit'
    previousButtonTitle='Back'
    canSaveDraft
    showSaveAndNextButton
    showBanner
  >
    <WizardStep<{ firstName: string }>
      title='Contact details'
      location='/step-1'
      initialValues={{ firstName: '' }}
      stepStatuses={twoStepStatuses}
      loadStepValues={() => ({ stepValues: { firstName: '' } })}
      bannerTitle='Create account'
      onSaveAndExit={async (values, isDirty) => {
        onSaveAndExit(values, isDirty);
        await onExit?.();
      }}
      onSaveAndNext={onSaveAndNext}
      {...(validateHard ? { validateHard } : {})}
    >
      <TextInput name='firstName' label='First name' />
    </WizardStep>
    <WizardStep<{ comments: string }>
      title='Review and submit'
      location='/step-2'
      initialValues={{ comments: '' }}
      isSummaryPage
      stepStatuses={twoStepStatuses}
      loadStepValues={() => ({ stepValues: { comments: '' } })}
      bannerTitle='Create account'
    >
      <p>Review your details.</p>
    </WizardStep>
  </WizardForm>
);

/**
 * SaveAndExitWaitsForSave — Save and exit calls the step's save with the
 * entered values, stays on the step while the save is in flight, and only
 * then navigates to the exit location (not the completion location).
 */
export const SaveAndExitWaitsForSave = meta.story({
  parameters: {
    portal: {
      initialEntries: ['/wizard/step-1'],
      routePath: '/wizard/*',
      destinationRoutes: exitDestinations,
    },
  },
  beforeEach: () => {
    onSaveAndExit.mockClear();
  },
  render: () => <SaveWizard onExit={startPendingSave} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('First name'), 'Ada');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );

    await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));

    await expect(onSaveAndExit.mock.calls[0]?.[0]).toMatchObject({
      firstName: 'Ada',
    });
    await expect(canvas.queryByText('Exited to dashboard')).toBeNull();
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Contact details' }),
    ).toBeVisible();

    pendingSave.finish();

    await expect(await canvas.findByText('Exited to dashboard')).toBeVisible();
    await expect(canvas.queryByText('Wizard completed')).toBeNull();
  },
});

/**
 * SaveAndExitFailureStaysOnStep — a rejected save keeps the user on the step
 * with their value and never navigates to the exit location.
 */
export const SaveAndExitFailureStaysOnStep = meta.story({
  parameters: {
    portal: {
      initialEntries: ['/wizard/step-1'],
      routePath: '/wizard/*',
      destinationRoutes: exitDestinations,
    },
  },
  beforeEach: () => {
    onSaveAndExit.mockClear();
  },
  render: () => (
    <SaveWizard onExit={() => Promise.reject(new Error('Save failed'))} />
  ),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('First name'), 'Ada');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and exit', hidden: true }),
    );

    await waitFor(() => expect(onSaveAndExit).toHaveBeenCalledTimes(1));

    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Contact details' }),
    ).toBeVisible();
    await expect(canvas.getByLabelText('First name')).toHaveValue('Ada');
    await expect(canvas.queryByText('Exited to dashboard')).toBeNull();
  },
});

/**
 * InvalidStepBlocksSubmit — Save and next with an invalid step shows the
 * validation error and does not save; correcting the value then saves it and
 * advances to the next step.
 */
export const InvalidStepBlocksSubmit = meta.story({
  parameters: {
    portal: { initialEntries: ['/wizard/step-1'], routePath: '/wizard/*' },
  },
  beforeEach: () => {
    onSaveAndNext.mockClear();
  },
  render: () => <SaveWizard validateHard={requireFirstName} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );

    await expect(
      (await canvas.findAllByText('Enter your first name')).length,
    ).toBeGreaterThan(0);
    await expect(onSaveAndNext).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByLabelText('First name'), 'Ada');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save and next' }),
    );

    await waitFor(() => expect(onSaveAndNext).toHaveBeenCalledTimes(1));

    await expect(onSaveAndNext.mock.calls[0]?.[0]).toMatchObject({
      firstName: 'Ada',
    });
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: 'Review and submit',
      }),
    ).toBeVisible();
  },
});
