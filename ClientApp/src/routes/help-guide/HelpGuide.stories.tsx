import preview from '../../../../.storybook/preview';
import HelpGuide from './index';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/HelpGuide',
  component: HelpGuide,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/help-guide'],
    },
  },
});

export const AuthenticatedJourney = meta.story();

export const PublicJourney = meta.story({
  parameters: {
    portal: {
      authenticated: false,
      initialEntries: ['/help-guide'],
    },
  },
});
