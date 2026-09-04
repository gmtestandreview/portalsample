import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import SubmittedSuccess from './submittedSuccess';
import { withPortalProviders } from '../../storybook/storybookHarness';

const meta = {
    title: 'Routes/AcceptQuote/SubmittedSuccess',
    component: SubmittedSuccess,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/submitted-success/Q-2024-000456'],
        },
    },
} satisfies Meta<typeof SubmittedSuccess>;

export default meta;
type Story = StoryObj<typeof meta>;

const paymentDetailsHandler = (paymentTerms: 'Prepaid' | 'Invoice') =>
    http.get('/api/accept-quote/:id/payment-details', () => HttpResponse.json({
        acceptQuotePreInfo: {
            paymentTerms,
            quotationIdNum: 'Q-2024-000456',
        },
    }));

export const Prepaid: Story = {
    beforeEach({ msw }) {
        msw.use(paymentDetailsHandler('Prepaid'));
    },
};

export const Postpaid: Story = {
    beforeEach({ msw }) {
        msw.use(paymentDetailsHandler('Invoice'));
    },
};
