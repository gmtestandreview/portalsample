import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Checkbox } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/CheckboxGroup',
  component: CheckboxGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const services = (
  <>
    <Checkbox value="testing">Testing and calibration</Checkbox>
    <Checkbox value="pattern">Pattern approval</Checkbox>
  </>
);

export const WithLabelAndDescription: Story = {
  render: (args) => <CheckboxGroup {...args}>{services}</CheckboxGroup>,
  args: {
    label: 'NMI services',
    description: 'Choose every service that applies to your business.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('NMI services')).toBeVisible();
    await expect(canvas.getByText('Choose every service that applies to your business.')).toBeVisible();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Pattern approval' }));

    await expect(canvas.getByRole('checkbox', { name: 'Pattern approval' })).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'Testing and calibration' })).not.toBeChecked();
  },
};

export const Bare: Story = {
  render: (args) => <CheckboxGroup {...args}>{services}</CheckboxGroup>,
  args: {
    // No visible <Label>/<Description>: the group renders its items and nothing
    // else. React Aria still requires an accessible name, so the group is named
    // by `aria-label` instead — without it React Aria logs a missing-label
    // warning and the group is exposed to assistive tech as unnamed.
    'aria-label': 'NMI services',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Testing and calibration' })).toBeInTheDocument();
    // Named for assistive tech, but with no on-screen label text.
    await expect(canvas.getByRole('group', { name: 'NMI services' })).toBeInTheDocument();
    await expect(canvas.queryByText('NMI services')).not.toBeInTheDocument();
  },
};

export const Horizontal: Story = {
  render: (args) => <CheckboxGroup {...args}>{services}</CheckboxGroup>,
  args: {
    label: 'NMI services',
    orientation: 'horizontal',
  },
  play: async ({ canvas }) => {
    // Orientation is published as a data attribute for the stylesheet to lay out against.
    const group = canvas.getByRole('group', { name: 'NMI services' });
    await expect(group).toHaveAttribute('data-orientation', 'horizontal');
  },
};

export const Invalid: Story = {
  render: (args) => <CheckboxGroup {...args}>{services}</CheckboxGroup>,
  args: {
    label: 'NMI services',
    isInvalid: true,
    errorMessage: 'Select at least one service before continuing.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Select at least one service before continuing.')).toBeVisible();
  },
};
