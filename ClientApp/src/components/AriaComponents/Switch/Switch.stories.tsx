import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Switch } from './Switch';
import { expect, userEvent } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  args: { children: 'Wi-Fi' },
  render: (args) => <Switch {...args}>Wi-Fi</Switch>,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch', { name: 'Wi-Fi' })).toBeVisible();
  },
});

export const Selected = meta.story({
  render: (args) => (
    <Switch {...args}>Wi-Fi</Switch>
  ),

  args: {
    defaultSelected: true,
    children: null,
  },

  play: async ({ canvas }) => {
    // Selected and unselected render different handle classes, so both states are worth pinning.
    await expect(canvas.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked();
  },
});

export const WithDescription = meta.story({
  render: (args) => (
    <Switch {...args}>Wi-Fi</Switch>
  ),

  args: {
    description: 'Turn off to save battery.',
    children: null,
  },

  play: async ({ canvas }) => {
    await expect(canvas.getByText('Turn off to save battery.')).toBeVisible();
  },
});

export const Toggles = meta.story({
  render: (args) => (
    <Switch {...args}>Wi-Fi</Switch>
  ),
  args: {
    children: null,
  },

  play: async ({ canvas }) => {
    const control = canvas.getByRole('switch', { name: 'Wi-Fi' });

    await expect(control).not.toBeChecked();

    await userEvent.click(control);

    await expect(control).toBeChecked();
  },
});
