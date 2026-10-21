import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Disclosure, DisclosureHeader, DisclosurePanel } from './Disclosure';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Disclosure',
  component: Disclosure,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryFn<typeof Disclosure>;

export const Example = {
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <Disclosure {...args}>
      <DisclosureHeader>Manage your account</DisclosureHeader>
      <DisclosurePanel>Details on managing your account</DisclosurePanel>
    </Disclosure>
  ),
  play: async ({ canvas }) => {
    const panelText = canvas.getByText('Details on managing your account');

    await expect(panelText.parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    await expect(panelText).toBeInTheDocument();
  },
} satisfies StoryObj<typeof meta>;
