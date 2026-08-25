import type { Meta, StoryObj } from '@storybook/react-vite';
import { InteractionStatus } from '@azure/msal-browser';
import SignIn from './index';
import SignOut from '../sign-out';
import SignOutHelper from '../sign-out-helper';
import { withPortalProviders, mockMsalAccount } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/Auth',
    component: SignIn,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof SignIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInLoading: Story = {};

export const SignOutLoading: Story = {
    render: () => <SignOut />,
    parameters: {
        portal: {
            authenticated: true,
            msalContext: {
                inProgress: InteractionStatus.None,
                accounts: [mockMsalAccount],
            },
        },
    },
};

export const SignOutCompletion: Story = {
    render: () => <SignOutHelper />,
    parameters: {
        portal: {
            authenticated: false,
            initialEntries: ['/sign-out-helper'],
        },
    },
};
