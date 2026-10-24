import preview from '../../../../.storybook/preview';
import RequestForQuoteCreated from './created';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/RequestForQuote/RequestCreated',
  component: RequestForQuoteCreated,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/request-for-quote-success/RFQ-2024-001234'],
    },
  },
});

export const Submitted = meta.story();
