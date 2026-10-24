import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { DisclosureGroup } from './DisclosureGroup';
import {
  Disclosure,
  DisclosureHeader,
  DisclosurePanel,
} from '../Disclosure/Disclosure';
import type { StoryFn } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/DisclosureGroup',
  component: DisclosureGroup,
  parameters: {
    layout: 'centered',
  },
});

type Story = StoryFn<typeof DisclosureGroup>;

export const Example = meta.story({
  render: (args: Readonly<Parameters<Story>[0]>) => (
    <DisclosureGroup {...args}>
      <Disclosure id='personal'>
        <DisclosureHeader>Personal Information</DisclosureHeader>
        <DisclosurePanel>
          <p>Personal information form here.</p>
        </DisclosurePanel>
      </Disclosure>
      <Disclosure id='billing'>
        <DisclosureHeader>Billing Address</DisclosureHeader>
        <DisclosurePanel>
          <p>Billing address form here.</p>
        </DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  ),
  args: {
    defaultExpandedKeys: ['personal'],
  },
  play: async ({ canvas }) => {
    const personalTrigger = canvas.getByRole('button', {
      name: 'Personal Information',
    });
    const billingTrigger = canvas.getByRole('button', {
      name: 'Billing Address',
    });

    await expect(personalTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(billingTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(
      canvas.getByText('Personal information form here.'),
    ).toBeInTheDocument();

    await userEvent.click(billingTrigger);

    await expect(personalTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(billingTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      canvas.getByText('Billing address form here.'),
    ).toBeInTheDocument();
  },
});
