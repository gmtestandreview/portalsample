import preview from '../../../../.storybook/preview';
import HelpHowToSetupAccess from './how-to-setup-access';
import FAQs from './faqs';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
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
});

export const HowToSetupAccess = meta.story();

export const FrequentlyAskedQuestions = meta.story({
  render: () => <FAQs />,
  parameters: {
    portal: {
      authenticated: false,
      initialEntries: ['/help-guide/faqs'],
    },
  },
});
