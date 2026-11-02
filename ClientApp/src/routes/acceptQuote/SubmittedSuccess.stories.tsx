import preview from '../../../../.storybook/preview';
import { http, HttpResponse } from 'msw/http';
import SubmittedSuccess from './submittedSuccess';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = preview.meta({
  title: 'Routes/AcceptQuote/SubmittedSuccess',
  component: SubmittedSuccess,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'fullscreen',
    portal: {
      initialEntries: ['/submitted-success/Q-2024-000456'],
    },
  },
});

const paymentDetailsHandler = (paymentTerms: 'Prepaid' | 'Invoice') =>
  http.get('/api/accept-quote/:id/payment-details', () =>
    HttpResponse.json({
      acceptQuotePreInfo: {
        paymentTerms,
        quotationIdNum: 'Q-2024-000456',
      },
    }),
  );

export const Prepaid = meta.story({
  beforeEach({ msw }) {
    msw.use(paymentDetailsHandler('Prepaid'));
  },
});

export const Postpaid = meta.story({
  beforeEach({ msw }) {
    msw.use(paymentDetailsHandler('Invoice'));
  },
});
