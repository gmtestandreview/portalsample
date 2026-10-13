import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import RhfNumberInput from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `NumberInput`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = {
  title: 'Components/Inputs/RhfNumberInput',
  component: RhfNumberInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { carrierContactPhone: '' } },
    },
  },
  args: {
    label: 'Carrier contact phone (optional)',
    name: 'carrierContactPhone',
    format: 'checkPhoneFormat',
  },
} satisfies Meta<typeof RhfNumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByLabelText('Carrier contact phone (optional)');

    await user.type(input, '0291234567');

    await expect(input).toHaveValue('02 9123 4567');
  },
};

export const Summary: Story = {
  args: { isSummary: true },
  parameters: {
    portal: {
      rhf: { defaultValues: { carrierContactPhone: '0291234567' } },
    },
  },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(
      canvas.getByText('Carrier contact phone (optional)')
    ).toBeInTheDocument();
  },
};
