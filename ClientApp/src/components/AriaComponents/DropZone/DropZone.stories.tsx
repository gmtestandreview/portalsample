import preview from '../../../../../.storybook/preview';
import { expect } from 'storybook/test';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DropZone, Text } from './DropZone';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DropZone',
  component: DropZone,
  parameters: {
    layout: 'centered',
  },
});


export const Example = meta.story({
  render: (args) => (
    <DropZone {...args}>
      <Text slot='label'>Drop supporting documents here</Text>
    </DropZone>
  ),
  play: async ({
    canvas,
  }) => {
    await expect(
      canvas.getByText('Drop supporting documents here'),
    ).toBeVisible();
  },
});

export const Disabled = meta.story({
  render: (args) => (
    <DropZone {...args}>
      <Text slot='label'>Uploads are closed for this application</Text>
    </DropZone>
  ),
  args: {
    isDisabled: true,
  },
  play: async ({
    canvas,
  }) => {
    // A closed application still explains why, rather than showing an inert target.
    await expect(
      canvas.getByText('Uploads are closed for this application'),
    ).toBeVisible();
  },
});
