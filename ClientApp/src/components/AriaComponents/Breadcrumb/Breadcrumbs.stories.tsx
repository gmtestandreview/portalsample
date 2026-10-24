import preview from '../../../../../.storybook/preview';
import { withReactAriaEvaluation } from '../../../storybook/withReactAriaEvaluation';
import { Breadcrumbs, Breadcrumb } from './Breadcrumbs';
import { expect } from 'storybook/test';

const meta = preview.meta({
  decorators: [withReactAriaEvaluation],
  title: 'Evaluation/React Aria/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
});

export const Example = meta.story({
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
});
