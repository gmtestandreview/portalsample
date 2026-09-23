import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import {
  clearGetStartedNotification,
  setGetStartedNotification,
} from '../../storage/notification.ts';
import { NotificationSeverity } from '../../storage/types.ts';
import { withPortalProviders } from '../../storybook/storybookHarness.tsx';
import GetStarted from './get-started.tsx';

const NotificationDecorator = (Story: ComponentType) => {
  setGetStartedNotification({
    message: 'Your Digital ID has been disconnected. Log in again to continue.',
    severity: NotificationSeverity.Information,
  });

  useEffect(() => () => clearGetStartedNotification(), []);

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
