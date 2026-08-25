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

export const Prepaid: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get('/api/accept-quote/:id/payment-details', () => HttpResponse.json({
                    acceptQuotePreInfo: {
                        paymentTerms: 'Prepaid',
                        quotationIdNum: 'Q-2024-000456',
                    },
                })),
            ],
        },
    },
};

export const Postpaid: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get('/api/accept-quote/:id/payment-details', () => HttpResponse.json({
                    acceptQuotePreInfo: {
                        paymentTerms: 'Invoice',
                        quotationIdNum: 'Q-2024-000456',
                    },
                })),
            ],
        },
    },
};
