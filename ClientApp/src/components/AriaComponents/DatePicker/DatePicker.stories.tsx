import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DatePicker } from './DatePicker';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryFn<typeof DatePicker>;
type ObjectStory = StoryObj<typeof meta>;

export const Example: ObjectStory = {
  args: {
    label: 'Event date',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'Event date' })
    ).toBeVisible();
  },
};

export const WithDescription: Story = (
  args: Readonly<Parameters<Story>[0]>
) => <DatePicker {...args} />;

WithDescription.args = {
  label: 'Event date',
  description: 'Pick the date the instrument was tested.',
};

WithDescription.play = async ({ canvas }) => {
  await expect(
    canvas.getByText('Pick the date the instrument was tested.')
  ).toBeVisible();
};

export const Invalid: Story = (args: Readonly<Parameters<Story>[0]>) => (
  <DatePicker {...args} />
);

Invalid.args = {
  label: 'Event date',
  isInvalid: true,
  errorMessage: 'Choose a date on or before today.',
};

Invalid.play = async ({ canvas }) => {
  await expect(
    canvas.getByText('Choose a date on or before today.')
  ).toBeVisible();
};
