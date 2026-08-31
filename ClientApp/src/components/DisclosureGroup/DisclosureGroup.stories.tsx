import {withReactAriaEvaluation} from '../../storybook/withReactAriaEvaluation';
import {DisclosureGroup} from './DisclosureGroup';
import {Disclosure, DisclosureHeader, DisclosurePanel} from '../Disclosure/Disclosure';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DisclosureGroup',
  component: DisclosureGroup,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DisclosureGroup>;

export default meta;
type Story = StoryFn<typeof DisclosureGroup>;

export const Example: Story = args => (
  <DisclosureGroup {...args}>
    <Disclosure id="personal">
      <DisclosureHeader>Personal Information</DisclosureHeader>
      <DisclosurePanel>
        <p>Personal information form here.</p>
      </DisclosurePanel>
    </Disclosure>
    <Disclosure id="billing">
      <DisclosureHeader>Billing Address</DisclosureHeader>
      <DisclosurePanel>
        <p>Billing address form here.</p>
      </DisclosurePanel>
    </Disclosure>
  </DisclosureGroup>
);

Example.args = {
  defaultExpandedKeys: ['personal']
};
