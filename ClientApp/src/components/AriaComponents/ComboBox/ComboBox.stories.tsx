import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ComboBox, ComboBoxItem } from './ComboBox';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ComboBox',
  component: ComboBox,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Choose a flavor',
  },
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryFn<typeof ComboBox>;
type ObjectStory = StoryObj<typeof meta>;

export const Example: ObjectStory = {
  render: (args) => (
    <ComboBox {...args}>
      <ComboBoxItem>Chocolate</ComboBoxItem>
      <ComboBoxItem>Mint</ComboBoxItem>
      <ComboBoxItem>Strawberry</ComboBoxItem>
      <ComboBoxItem>Vanilla</ComboBoxItem>
    </ComboBox>
  ),
  args: {
    label: 'Ice cream flavor',
    children: null,
  },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('combobox', { name: 'Ice cream flavor' });
    const suggestions = canvas.getByRole('button', {
      name: /Show suggestions/,
    });

    await expect(input).toBeInTheDocument();

    await userEvent.click(suggestions);

    await expect(suggestions).toHaveAttribute('aria-expanded', 'true');
    await expect(
      within(canvasElement.ownerDocument.body).getByRole('option', {
        name: 'Chocolate',
      })
    ).toBeInTheDocument();
  },
};

const flavours = (
  <>
    <ComboBoxItem>Chocolate</ComboBoxItem>
    <ComboBoxItem>Mint</ComboBoxItem>
    <ComboBoxItem>Strawberry</ComboBoxItem>
    <ComboBoxItem>Vanilla</ComboBoxItem>
  </>
);

export const WithDescription: Story = (
  args: Readonly<Parameters<Story>[0]>
) => <ComboBox {...args}>{flavours}</ComboBox>;

WithDescription.args = {
  label: 'Ice cream flavor',
  description: 'Start typing to filter the list.',
};

WithDescription.play = async ({ canvas }) => {
  await expect(
    canvas.getByText('Start typing to filter the list.')
  ).toBeVisible();
};

export const Unlabelled: Story = (args: Readonly<Parameters<Story>[0]>) => (
  <ComboBox {...args} aria-label='Ice cream flavor'>
    {flavours}
  </ComboBox>
);

Unlabelled.play = async ({ canvas }) => {
  // No label prop means no Label element; the combo box is named by aria-label instead.
  await expect(
    canvas.getByRole('combobox', { name: 'Ice cream flavor' })
  ).toBeInTheDocument();
};

export const Invalid: Story = (args: Readonly<Parameters<Story>[0]>) => (
  <ComboBox {...args}>{flavours}</ComboBox>
);

Invalid.args = {
  label: 'Ice cream flavor',
  isInvalid: true,
  errorMessage: 'Choose a flavour before continuing.',
};

Invalid.play = async ({ canvas }) => {
  await expect(
    canvas.getByText('Choose a flavour before continuing.')
  ).toBeVisible();
};

export const SelectsAFlavour: Story = (
  args: Readonly<Parameters<Story>[0]>
) => <ComboBox {...args}>{flavours}</ComboBox>;

SelectsAFlavour.args = {
  label: 'Ice cream flavor',
};

SelectsAFlavour.play = async ({ canvas }) => {
  const input = canvas.getByRole('combobox', { name: 'Ice cream flavor' });

  await userEvent.click(input);
  await userEvent.type(input, 'Mint');

  await expect(input).toHaveValue('Mint');
};

export const MultipleSelection: Story = (
  args: Readonly<Parameters<Story>[0]>
) => <ComboBox {...args}>{flavours}</ComboBox>;

MultipleSelection.args = {
  label: 'Ice cream flavor',
  selectionMode: 'multiple',
};

MultipleSelection.play = async ({ canvas }) => {
  // Multiple selection adds a value summary above the field so chosen items stay visible.
  await expect(canvas.getByText('No items selected')).toBeVisible();
};
