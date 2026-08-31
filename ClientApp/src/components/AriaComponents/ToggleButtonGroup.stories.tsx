import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ToggleButtonGroup} from './ToggleButtonGroup';
import {ToggleButton} from './ToggleButton';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ToggleButtonGroup',
  component: ToggleButtonGroup,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;

type Story = StoryFn<typeof ToggleButtonGroup>;

export const Example: Story = args => (
  <ToggleButtonGroup {...args}>
    <ToggleButton id="left">Left</ToggleButton>
    <ToggleButton id="center">Center</ToggleButton>
    <ToggleButton id="right">Right</ToggleButton>
  </ToggleButtonGroup>
);
