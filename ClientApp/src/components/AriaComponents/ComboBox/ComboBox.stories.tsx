import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ComboBox, ComboBoxItem } from './ComboBox';
import { expect, userEvent, within } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ComboBox',
  component: ComboBox,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Choose a flavor',
  },
});


export const Example = meta.story({
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
      }),
    ).toBeInTheDocument();
  },
});

const flavours = (
  <>
    <ComboBoxItem>Chocolate</ComboBoxItem>
    <ComboBoxItem>Mint</ComboBoxItem>
    <ComboBoxItem>Strawberry</ComboBoxItem>
    <ComboBoxItem>Vanilla</ComboBoxItem>
  </>
);

export const WithDescription = meta.story({
  render: (args) => (
    <ComboBox {...args}>{flavours}</ComboBox>
  ),

  args: {
    label: 'Ice cream flavor',
    description: 'Start typing to filter the list.',
    children: null,
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Start typing to filter the list.'),
    ).toBeVisible();
  },
});

export const Unlabelled = meta.story({
  args: {
    children: null,
  },
  render: (args) => (
    <ComboBox {...args} aria-label='Ice cream flavor'>
      {flavours}
    </ComboBox>
  ),

  play: async ({ canvas }) => {
    // No label prop means no Label element; the combo box is named by aria-label instead.
    await expect(
      canvas.getByRole('combobox', { name: 'Ice cream flavor' }),
    ).toBeInTheDocument();
  },
});

export const Invalid = meta.story({
  render: (args) => (
    <ComboBox {...args}>{flavours}</ComboBox>
  ),

  args: {
    label: 'Ice cream flavor',
    isInvalid: true,
    errorMessage: 'Choose a flavour before continuing.',
    children: null,
  },

  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Choose a flavour before continuing.'),
    ).toBeVisible();
  },
});

export const SelectsAFlavour = meta.story({
  render: (args) => (
    <ComboBox {...args}>{flavours}</ComboBox>
  ),

  args: {
    label: 'Ice cream flavor',
    children: null,
  },

  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Ice cream flavor' });

    await userEvent.click(input);
    await userEvent.type(input, 'Mint');

    await expect(input).toHaveValue('Mint');
  },
});

export const MultipleSelection = meta.story({
  render: (args) => (
    <ComboBox {...args}>{flavours}</ComboBox>
  ),

  args: {
    label: 'Ice cream flavor',
    selectionMode: 'multiple',
    children: null,
  },

  play: async ({ canvas }) => {
    // Multiple selection adds a value summary above the field so chosen items stay visible.
    await expect(canvas.getByText('No items selected')).toBeVisible();
  },
});
