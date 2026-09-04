import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Slider} from './Slider';
import type {Meta, StoryFn} from '@storybook/react-vite';
import {expect} from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Slider',
  component: Slider,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryFn<typeof Slider>;

export const Example: Story = args => <Slider {...args} style={{width: 200}} />;

Example.args = {
  label: 'Range',
  defaultValue: [30, 60],
  thumbLabels: ['start', 'end']
};

export const Unlabelled: Story = args => (
  <Slider {...args} aria-label="Range" style={{width: 200}} />
);

Unlabelled.args = {
  defaultValue: [30, 60]
};

Unlabelled.play = async ({canvas}) => {
  // No label prop renders no Label element; the group is named by aria-label instead.
  await expect(canvas.getByRole('group', {name: 'Range'})).toBeInTheDocument();
};

export const NamedThumbs: Story = args => <Slider {...args} style={{width: 200}} />;

NamedThumbs.args = {
  label: 'Price range',
  defaultValue: [30, 60],
  thumbLabels: ['Minimum', 'Maximum']
};

NamedThumbs.play = async ({canvas}) => {
  // Supplying thumbLabels names each handle rather than falling back to a positional id. The
  // accessible name is composed from the thumb label plus the group label and current output, so
  // this matches on the thumb's own contribution.
  await expect(canvas.getByRole('slider', {name: /^Minimum/})).toBeInTheDocument();
  await expect(canvas.getByRole('slider', {name: /^Maximum/})).toBeInTheDocument();
};
