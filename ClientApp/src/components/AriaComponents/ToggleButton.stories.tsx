import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ToggleButton} from './ToggleButton';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;

type Story = StoryFn<typeof ToggleButton>;

export const Example: Story = args => <ToggleButton {...args}>Pin</ToggleButton>;
