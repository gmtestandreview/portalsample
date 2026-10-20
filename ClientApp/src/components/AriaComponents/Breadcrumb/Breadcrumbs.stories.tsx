import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Breadcrumbs, Breadcrumb } from './Breadcrumbs';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta = {
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <Breadcrumbs {...args}>
      <Breadcrumb href='/'>Home</Breadcrumb>
      <Breadcrumb href='/react-aria/'>React Aria</Breadcrumb>
      <Breadcrumb>Breadcrumbs</Breadcrumb>
    </Breadcrumbs>
  ),
  play: async ({ canvas }) => {
    const breadcrumbList = canvas.getByRole('list', { name: 'Breadcrumbs' });
    const homeLink = canvas.getByRole('link', { name: 'Home' });
    const currentCrumb = canvas.getByText('Breadcrumbs');

    await expect(breadcrumbList).toBeInTheDocument();
    await expect(homeLink).toHaveAttribute('href', '/');
    await expect(currentCrumb).toBeInTheDocument();
    await expect(currentCrumb).not.toHaveAttribute('href');
  },
};
