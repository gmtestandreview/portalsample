import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from 'react-aria-components/Input';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { InputGroup } from './InputGroup';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/InputGroup',
  component: InputGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  render: (args) => (
    <InputGroup {...args}>
      <Input aria-label="Certificate number" placeholder="5/6A/91B" />
    </InputGroup>
  ),
  args: {
    label: 'Certificate number',
  },
  play: async ({ canvas }) => {
    // The label is rendered as a span and wired to the group by aria-labelledby, so the group is
    // announced by name rather than as an anonymous container.
    await expect(canvas.getByText('Certificate number')).toBeVisible();
    await expect(canvas.getByRole('group', { name: 'Certificate number' })).toBeInTheDocument();
  },
};

export const WithoutLabel: Story = {
  render: (args) => (
    <InputGroup {...args}>
      <Input aria-label="Search" placeholder="Search applications" />
    </InputGroup>
  ),
  play: async ({ canvas }) => {
    // No label prop means no label element at all - the group still renders its children.
    await expect(canvas.getByPlaceholderText('Search applications')).toBeVisible();
  },
};

export const Disabled: Story = {
  render: (args) => (
    <InputGroup {...args}>
      <Input aria-label="Certificate number" placeholder="5/6A/91B" />
    </InputGroup>
  ),
  args: {
    label: 'Certificate number',
    isDisabled: true,
  },
  play: async ({ canvas }) => {
    // The group pushes its disabled state down through InputContext, so the input inside is
    // disabled without being told separately.
    await expect(canvas.getByPlaceholderText('5/6A/91B')).toBeDisabled();
  },
};
