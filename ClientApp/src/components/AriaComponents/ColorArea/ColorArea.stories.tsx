import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { ColorArea } from './ColorArea';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/ColorArea',
  component: ColorArea,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => <ColorArea {...args} style={{ width: 200 }} />,
  args: {
    defaultValue: 'hsl(30, 100%, 50%)',
  },
  play: async ({ canvas }) => {
    const colorArea = canvas.getByRole('group');
    const marker = 'group';

    await expect(colorArea).toBeInTheDocument();
    await expect(colorArea).toHaveAttribute('role', marker);
  },
});
