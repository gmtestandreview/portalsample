import type { Meta, StoryObj } from '@storybook/react-vite';
import HelpGuide from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/HelpGuide',
    component: HelpGuide,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/help-guide'],
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof HelpGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AuthenticatedJourney: Story = {};

export const PublicJourney: Story = {
    parameters: {
        portal: {
            authenticated: false,
            initialEntries: ['/help-guide'],
        },
    },
};
