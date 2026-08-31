import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Meter} from './Meter';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Meter',
  component: Meter,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryFn<typeof Meter>;

export const Example: Story = args => <Meter {...args} />;

Example.args = {
  label: 'Storage space',
  value: 80
};
