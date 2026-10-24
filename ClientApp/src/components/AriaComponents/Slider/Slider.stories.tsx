import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Slider } from './Slider';
import type { StoryFn } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof Slider>;

export const Example = meta.story({
  args: {
    label: 'Range',
    defaultValue: [30, 60],
    thumbLabels: ['start', 'end'],
  },
  render: (args) => <Slider {...args} style={{ width: 200 }} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Range' })).toBeVisible();
  },
});

export const Unlabelled = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <Slider {...args} aria-label='Range' style={{ width: 200 }} />
  ),

  args: {
    defaultValue: [30, 60],
  },

  play: async ({ canvas }) => {
    // No label prop renders no Label element; the group is named by aria-label instead.
    await expect(
      canvas.getByRole('group', { name: 'Range' }),
    ).toBeInTheDocument();
  },
});

export const NamedThumbs = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <Slider {...args} style={{ width: 200 }} />
  ),

  args: {
    label: 'Price range',
    defaultValue: [30, 60],
    thumbLabels: ['Minimum', 'Maximum'],
  },

  play: async ({ canvas }) => {
    // Supplying thumbLabels names each handle rather than falling back to a positional id. The
    // accessible name is composed from the thumb label plus the group label and current output, so
    // this matches on the thumb's own contribution.
    await expect(
      canvas.getByRole('slider', { name: /^Minimum/ }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('slider', { name: /^Maximum/ }),
    ).toBeInTheDocument();
  },
});
