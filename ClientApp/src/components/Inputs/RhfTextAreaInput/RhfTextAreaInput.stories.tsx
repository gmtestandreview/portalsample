import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import RhfTextAreaInput from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `TextAreaInput`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = {
  title: 'Components/Inputs/RhfTextAreaInput',
  component: RhfTextAreaInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { packagingNotes: 'Fragile' } },
    },
  },
  args: {
    label: 'Packaging notes (optional)',
    name: 'packagingNotes',
  },
} satisfies Meta<typeof RhfTextAreaInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const input = canvas.getByLabelText('Packaging notes (optional)');

    await expect(input).toHaveValue('Fragile');

    await user.clear(input);
    await user.type(input, 'Keep dry');

    await expect(input).toHaveValue('Keep dry');
  },
};

export const WithCharacterCounter: Story = {
  args: { maxCharacters: 300, rows: 4 },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('7 of 300 characters used')
    ).toBeInTheDocument();
  },
};

export const Summary: Story = {
  args: { isSummary: true },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Fragile')).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
  },
};
