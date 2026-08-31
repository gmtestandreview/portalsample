import {withReactAriaEvaluation} from '../../../storybook/withReactAriaEvaluation';
import {Breadcrumbs, Breadcrumb} from './Breadcrumbs';
import type {Meta, StoryFn} from '@storybook/react-vite';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryFn<typeof Breadcrumbs>;

export const Example: Story = args => (
  <Breadcrumbs {...args}>
    <Breadcrumb href="/">Home</Breadcrumb>
    <Breadcrumb href="/react-aria/">React Aria</Breadcrumb>
    <Breadcrumb>Breadcrumbs</Breadcrumb>
  </Breadcrumbs>
);
