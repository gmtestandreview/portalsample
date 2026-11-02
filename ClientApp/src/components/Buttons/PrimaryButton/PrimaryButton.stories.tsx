import preview from '../../../../../.storybook/preview';
import { linkTo } from '@storybook/addon-links';
import { expect } from 'storybook/test';
import PrimaryButton from './index';

const meta = preview.meta({
  component: PrimaryButton,
  argTypes: {
    mode: {
      options: ['light', 'dark'],
      control: 'inline-radio',
      table: {
        category: 'Appearance',
      },
    },
  },
});

export const Default = meta.story({
  args: {
    children: 'Submit',
  },
});

export const DarkMode = meta.story({
  args: {
    children: 'Continue',
    mode: 'dark',
  },
});

export const Disabled = meta.story({
  args: {
    children: 'Submit',
    disabled: true,
  },
});

export const StoryLinkDemo = meta.story({
  args: {
    children: 'Go to Disabled story',
  },
  render: (args) => (
    <PrimaryButton
      {...args}
      onClick={linkTo('Components/Buttons/PrimaryButton', 'Disabled')}
    />
  ),
});

export const CssCheck = meta.story({
  args: {
    children: 'Submit',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i });

    await expect(button).toHaveAccessibleName('Submit');

    // _buttons.scss maps .btn-nmi-primary to $nmi-primary (#285576).
    await expect(getComputedStyle(button).backgroundColor).toBe(
      'rgb(40, 85, 118)',
    );
  },
});
