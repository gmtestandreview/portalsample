import type { Meta, StoryObj } from '@storybook/react-vite';
import HelpHowToSetupAccess from './how-to-setup-access';
import FAQs from './faqs';
import { withPortalProviders } from '../../storybook/storybookHarness';

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
    render: () => <FAQs />,
    parameters: {
        portal: {
            authenticated: false,
            initialEntries: ['/help-guide/faqs'],
        },
    },
};
