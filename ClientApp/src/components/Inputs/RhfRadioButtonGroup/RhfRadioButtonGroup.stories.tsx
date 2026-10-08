import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import RhfRadioButtonGroup from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `RadioButtonGroup`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = {
  title: 'Components/Inputs/RhfRadioButtonGroup',
  component: RhfRadioButtonGroup,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { contactOption: 'same' } },
    },
  },
  args: {
    legend: 'Invoice contact',
    name: 'contactOption',
    id: 'invoice-contact-option',
    options: [
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
    ],
  },
} satisfies Meta<typeof RhfRadioButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await expect(
      canvas.getByLabelText('Use the request contact')
    ).toBeChecked();

    await user.click(canvas.getByLabelText('Use a different contact'));

    await expect(
      canvas.getByLabelText('Use a different contact')
    ).toBeChecked();
    await expect(
      canvas.getByLabelText('Use the request contact')
    ).not.toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Use the request contact')
    ).toBeDisabled();
    await expect(
      canvas.getByLabelText('Use a different contact')
    ).toBeDisabled();
  },
};

export const WithInlineHelp: Story = {
  args: { inlineHelp: 'Invoices are emailed to the chosen contact.' },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Invoices are emailed to the chosen contact.')
    ).toHaveAttribute('id', 'help-invoice-contact-option');
    await expect(
      canvas.getByTestId('fs-invoice-contact-option')
    ).toHaveAttribute('aria-describedby', 'help-invoice-contact-option');
  },
};
