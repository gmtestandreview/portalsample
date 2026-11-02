import preview from '../../../../.storybook/preview';
import AccountCreated from './created';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/Account/AccountCreated',
  component: AccountCreated,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/success-creating-account'],
    },
  },
});

export const Default = meta.story();
