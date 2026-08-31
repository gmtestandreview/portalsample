import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Switch} from './Switch';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Switch',
  component: Switch,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryFn<typeof Switch>;

export const Example: Story = args => <Switch {...args}>Wi-Fi</Switch>;
