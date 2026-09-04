import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import type { ComponentType } from 'react';
import GetStarted from './get-started';
import { setGetStartedNotification, clearGetStartedNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { withPortalProviders } from '../../storybook/storybookHarness';

const NotificationDecorator = (Story: ComponentType) => {
    setGetStartedNotification({
        message: 'Your Digital ID has been disconnected. Log in again to continue.',
        severity: NotificationSeverity.Information,
    });

    useEffect(() => {
        return () => clearGetStartedNotification();
    }, []);

    return <Story />;
};

const meta = {
    title: 'Routes/Home/GetStarted',
    component: GetStarted,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: false,
            initialEntries: ['/'],
        },
    },
} satisfies Meta<typeof GetStarted>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicLanding: Story = {};

export const WithInformationBanner: Story = {
    decorators: [NotificationDecorator],
};
