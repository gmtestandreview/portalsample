import type { Meta, StoryObj } from '@storybook/react-vite';
import { withPortalProviders } from '../../storybook/storybookHarness.tsx';
import FaQs from './faqs.tsx';
import HelpHowToSetupAccess from './how-to-setup-access.tsx';

const meta = {
  title: 'Routes/HelpGuide/Details',
  component: HelpHowToSetupAccess,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      authenticated: false,
      initialEntries: ['/help-guide/how-to-setup-access'],
    },
  },
} satisfies Meta<typeof HelpHowToSetupAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HowToSetupAccess: Story = {};

export const FrequentlyAskedQuestions: Story = {
  render: () => <FaQs />,
  parameters: {
    portal: {
      authenticated: false,
      initialEntries: ['/help-guide/faqs'],
    },
  },
};
