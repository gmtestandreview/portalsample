import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import RhfSelectInput from '.';
import { withPortalProviders } from '../../../storybook/storybookHarness';

/**
 * React Hook Form counterpart of `SelectInput`. It must render inside a
 * `FormProvider`; the portal harness supplies one through the `portal.rhf`
 * story parameter.
 */
const meta = {
  title: 'Components/Inputs/RhfSelectInput',
  component: RhfSelectInput,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
    portal: {
      rhf: { defaultValues: { category: '' } },
    },
  },
  args: {
    name: 'category',
    label: 'Category',
    addBlank: true,
    defaultDisplayText: 'Select',
    options: [
      { displayText: 'Certificate', value: 'Certificate' },
      { displayText: 'Manuals', value: 'Manuals' },
    ],
  },
} satisfies Meta<typeof RhfSelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Category' });

    await expect(select).toHaveValue('');

    await userEvent.selectOptions(select, 'Manuals');

    await expect(select).toHaveValue('Manuals');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('combobox', { name: 'Category' })
    ).toBeDisabled();
  },
};

export const Summary: Story = {
  args: { isSummary: true },
  parameters: {
    portal: {
      rhf: { defaultValues: { category: 'Certificate' } },
    },
  },
  play: async ({
    canvasElement,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Certificate')).toBeVisible();
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument();
  },
};
