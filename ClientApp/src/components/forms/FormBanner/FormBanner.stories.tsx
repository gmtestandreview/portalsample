import type { Meta, StoryObj } from '@storybook/react-vite';
import { useFormikContext } from 'formik';
import { useLocation } from 'react-router';
import { expect, within } from 'storybook/test';
import { withPortalProviders } from '../../../storybook/storybookHarness';
import FormBanner from '.';

const meta = {
  title: 'Components/Forms/FormBanner',
  component: FormBanner,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FormBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const FormikSubmissionProbe = () => {
  const { values } = useFormikContext<Record<string, unknown>>();
  return (
    <output aria-label='Form submission state'>
      saveAndExit={String(values['saveAndExit'] ?? false)}
    </output>
  );
};

const DiscardLocationProbe = () => {
  const location = useLocation();
  return <output aria-label='Discard destination'>{location.pathname}</output>;
};

/**
 * SaveAndExit — shows the Save and Exit button in the form navbar.
 * Requires router context (useNavigate) provided by withPortalProviders.
 */
export const SaveAndExit: Story = {
  // SaveAndExitButton calls useFormikContext() — Formik context is required.
  parameters: {
    portal: {
      formik: { initialValues: {} },
    },
  },
  args: {
    title: 'Request for Quote',
    refTitle: 'RFQ-2024-001',
    showSaveAndExitButton: true,
  },
  render: (args) => (
    <>
      <FormBanner {...args} />
      <FormikSubmissionProbe />
    </>
  ),
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    // The form actions toolbar should render
    const toolbar = canvas.getByRole('toolbar', { name: /form actions/i });

    await expect(toolbar).toBeInTheDocument();

    canvas.getByRole('button', { name: 'Save and exit' }).click();

    await expect(
      await canvas.findByLabelText('Form submission state')
    ).toHaveTextContent('saveAndExit=true');
  },
};

/**
 * GoToDashboard — shows the "Go to dashboard" link button in the form navbar.
 */
export const GoToDashboard: Story = {
  args: {
    title: 'Service Quote',
    refTitle: 'SQ-2024-042',
    showGoToDashboardButton: true,
  },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const dashboardLink = canvas.getByTestId(
      'form-go-to-dashboard-portal-button'
    );

    await expect(dashboardLink).toBeInTheDocument();
    await expect(dashboardLink).toHaveTextContent(/go to dashboard/i);
  },
};

/**
 * WithDiscard — shows a Discard changes button that navigates to locationOnDiscard
 * when clicked.
 */
export const WithDiscard: Story = {
  args: {
    title: 'Measurement Report',
    refTitle: 'MR-2024-007',
    discard: {
      locationOnDiscard: '/',
      discardButtonTitle: 'Discard changes',
    },
  },
  render: (args) => (
    <>
      <FormBanner {...args} />
      <DiscardLocationProbe />
    </>
  ),
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const discardButton = canvas.getByTestId('discard-changes-button');

    await expect(discardButton).toBeInTheDocument();
    await expect(discardButton).toHaveTextContent(/discard changes/i);

    discardButton.click();

    await expect(
      await canvas.findByLabelText('Discard destination')
    ).toHaveTextContent('/');
  },
};

/**
 * TitleOnly — renders the banner with just a title and reference, no action buttons.
 */
export const TitleOnly: Story = {
  args: {
    title: 'Request for Quote',
    refTitle: 'RFQ-2024-001',
  },
};
