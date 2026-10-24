import { expect as storybookExpect } from 'storybook/test';

const meta = {
  title: 'Components/Field',
};

export default meta;

export const Default = {
  play: async () => {
    await storybookExpect('expect-visible-label').toBe('expect-visible-label');
  },
};
