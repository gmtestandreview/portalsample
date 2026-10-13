import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import RhfCheckbox from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `Checkbox`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = {
  title: 'Components/Inputs/RhfCheckbox',
  component: RhfCheckbox,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { acceptanceOfQuote: false } },
    },
  },
  args: {
    label: 'Yes, on behalf of my organisation, I accept the quotation',
    name: 'acceptanceOfQuote',
  },
} satisfies Meta<typeof RhfCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const checkbox = canvas.getByLabelText(
      'Yes, on behalf of my organisation, I accept the quotation'
    );

    await expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    await expect(checkbox).toBeChecked();
  },
};

export const WithInlineHelp: Story = {
  args: { inlineHelp: 'You must accept to continue.' },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('You must accept to continue.')
    ).toHaveAttribute('id', 'help-acceptanceOfQuote');
    await expect(canvas.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'help-acceptanceOfQuote'
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('checkbox')).toBeDisabled();
  },
};

export const Summary: Story = {
  args: { isSummary: true },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No')).toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
};
