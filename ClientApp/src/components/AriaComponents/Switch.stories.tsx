import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Switch} from './Switch';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect, userEvent} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Switch',
  component: Switch,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryFn<typeof Switch>;

export const Example: Story = args => <Switch {...args}>Wi-Fi</Switch>;

export const Selected: Story = args => <Switch {...args}>Wi-Fi</Switch>;

Selected.args = {
  defaultSelected: true
};

Selected.play = async ({canvas}) => {
  // Selected and unselected render different handle classes, so both states are worth pinning.
  await expect(canvas.getByRole('switch', {name: 'Wi-Fi'})).toBeChecked();
};

export const WithDescription: Story = args => <Switch {...args}>Wi-Fi</Switch>;

WithDescription.args = {
  description: 'Turn off to save battery.'
};

WithDescription.play = async ({canvas}) => {
  await expect(canvas.getByText('Turn off to save battery.')).toBeVisible();
};

export const Toggles: Story = args => <Switch {...args}>Wi-Fi</Switch>;

Toggles.play = async ({canvas}) => {
  const control = canvas.getByRole('switch', {name: 'Wi-Fi'});
  await expect(control).not.toBeChecked();

  await userEvent.click(control);

  await expect(control).toBeChecked();
};
