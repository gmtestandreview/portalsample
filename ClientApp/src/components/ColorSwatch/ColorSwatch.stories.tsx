import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {ColorSwatch} from './ColorSwatch';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorSwatch',
  component: ColorSwatch,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryFn<typeof ColorSwatch>;

export const Example: Story = args => <ColorSwatch {...args} />;

Example.args = {
  color: '#f00a'
};
