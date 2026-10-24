import preview from '../../../../.storybook/preview';
import { InteractionStatus } from '@azure/msal-browser';
import SignIn from './index';
import SignOut from '../sign-out';
import SignOutHelper from '../sign-out-helper';
import {
  withPortalProviders,
  mockMsalAccount,
} from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/Auth',
  component: SignIn,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
  },
});

export const SignInLoading = meta.story();

export const SignOutLoading = meta.story({
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
});

export const SignOutCompletion = meta.story({
  render: () => <SignOutHelper />,
  parameters: {
    portal: {
      authenticated: false,
      initialEntries: ['/sign-out-helper'],
    },
  },
});
