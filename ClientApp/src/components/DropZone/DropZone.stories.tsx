import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withReactAriaEvaluation } from '../../storybook/withReactAriaEvaluation';
import { DropZone, Text } from './DropZone';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DropZone',
  component: DropZone,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args: Readonly<Parameters<NonNullable<Story['render']>>[0]>) => (
    <DropZone {...args}>
      <Text slot='label'>Drop supporting documents here</Text>
    </DropZone>
  ),
  play: async ({
    canvas,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    await expect(
      canvas.getByText('Drop supporting documents here')
    ).toBeVisible();
  },
};

export const Disabled: Story = {
  render: (args: Readonly<Parameters<NonNullable<Story['render']>>[0]>) => (
    <DropZone {...args}>
      <Text slot='label'>Uploads are closed for this application</Text>
    </DropZone>
  ),
  args: {
    isDisabled: true,
  },
  play: async ({
    canvas,
  }: Readonly<Parameters<NonNullable<Story['play']>>[0]>) => {
    // A closed application still explains why, rather than showing an inert target.
    await expect(
      canvas.getByText('Uploads are closed for this application')
    ).toBeVisible();
  },
};
