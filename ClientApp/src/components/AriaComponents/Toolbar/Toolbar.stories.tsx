import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Toolbar } from './Toolbar';
import { Separator } from '../Seperator/Separator';
import { Group } from 'react-aria-components/Group';
import { Button } from '../Button/Button';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { Checkbox } from '../Checkbox/Checkbox';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
  render: (args) => (
    <Toolbar aria-label='Text formatting' {...args}>
      <Group aria-label='Style'>
        <ToggleButton aria-label='Bold'>
          <b>B</b>
        </ToggleButton>
        <ToggleButton aria-label='Italic'>
          <i>I</i>
        </ToggleButton>
        <ToggleButton aria-label='Underline'>
          <u>U</u>
        </ToggleButton>
      </Group>
      <Separator />
      <Group aria-label='Clipboard'>
        <Button>Copy</Button>
        <Button>Paste</Button>
        <Button>Cut</Button>
      </Group>
      <Separator />
      <Checkbox>Night Mode</Checkbox>
    </Toolbar>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('toolbar', { name: 'Text formatting' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible();
  },
});
