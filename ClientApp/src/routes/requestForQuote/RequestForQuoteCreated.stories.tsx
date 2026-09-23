import type { Meta, StoryObj } from '@storybook/react-vite';
import { withPortalProviders } from '../../storybook/storybookHarness.tsx';
import RequestForQuoteCreated from './created/index.tsx';

const meta = {
  title: 'Routes/RequestForQuote/RequestCreated',
  component: RequestForQuoteCreated,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/request-for-quote-success/RFQ-2024-001234'],
    },
  },
} satisfies Meta<typeof RequestForQuoteCreated>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Submitted: Story = {};
