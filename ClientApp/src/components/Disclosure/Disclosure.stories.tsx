import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {Disclosure, DisclosureHeader, DisclosurePanel} from './Disclosure';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Disclosure',
  component: Disclosure,
  parameters: {
    layout: 'centered'
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryFn<typeof Disclosure>;

export const Example: Story = args => (
  <Disclosure {...args}>
    <DisclosureHeader>Manage your account</DisclosureHeader>
    <DisclosurePanel>Details on managing your account</DisclosurePanel>
  </Disclosure>
);
