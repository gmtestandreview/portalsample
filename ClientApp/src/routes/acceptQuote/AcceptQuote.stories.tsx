import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';
import ReportRecipient from './reportRecipient';
import PaymentDetails from './paymentDetails';
import DeliveryAndReturn from './deliveryAndReturn';
import QuotationSummary from './quotationSummary';
import SummaryAndAccept from './summaryAndAccept';
import { withPortalProviders } from '../../storybook/storybookHarness';

const reportRecipientHandler = http.get('/api/accept-quote/:id/report-recipient', () => HttpResponse.json({
    reportAddressType: 'BusinessAddress',
    organisationName: 'Storybook Organisation',
    rfqOrganisation: {
        streetAddress: {
            line1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
        postalAddressSameAsStreetAddress: true,
        postalAddress: {
            line1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
    },
    acceptQuotePreInfo: {
        quotationIdNum: 'Q-2024-000456',
    },
}));

const reportRecipientOtherAddressHandler = http.get('/api/accept-quote/:id/report-recipient', () => HttpResponse.json({
    reportAddressType: 'Other',
    organisationName: 'Storybook Organisation',
    businessStreetAddress: {
        line1: '200 Custom Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
    },
    rfqOrganisation: {
        streetAddress: {
            line1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
        postalAddressSameAsStreetAddress: false,
        postalAddress: {
            line1: 'PO Box 10',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
    },
    acceptQuotePreInfo: {
        quotationIdNum: 'Q-2024-000456',
    },
}));

const paymentDetailsHandler = http.get('/api/accept-quote/:id/payment-details', () => HttpResponse.json({
    acceptQuotePreInfo: {
        paymentTerms: 'Prepaid',
        quotationIdNum: 'Q-2024-000456',
    },
}));

const meta = {
    title: 'Routes/AcceptQuote',
    component: ReportRecipient,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
        portal: {
            initialEntries: ['/accept-quote/123/report-recipient'],
            formik: {
                initialValues: {
                    organisationName: 'Storybook Organisation',
                    reportAddressType: 'BusinessAddress',
                    businessStreetAddress: {},
                    purchaseOrderNo: 'PO-4455',
                    invoiceSentTo: 'DifferentPerson',
                    contact: {
                        firstName: 'Taylor',
                        lastName: 'Nguyen',
                        email: 'accounts@example.com',
                        businessPhone: '02 7000 0000',
                        mobilePhone: '0400 111 111',
                    },
                },
            },
        },
        msw: {
            handlers: [reportRecipientHandler, paymentDetailsHandler],
        },
    },
} satisfies Meta<typeof ReportRecipient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReportRecipientStep: Story = {
    render: () => <ReportRecipient id='123' />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: /report recipient organisation/i })).toBeVisible();
        await expect(canvas.getByLabelText(/organisation name for report/i)).toBeVisible();
        await expect(canvas.getByText(/organisation address for report/i)).toBeVisible();
    },
};

export const ReportRecipientSummaryOtherAddress: Story = {
    render: () => <ReportRecipient id='123' isSummary />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/summary-and-accept'],
            formik: {
                initialValues: {
                    reportRecipient: {
                        organisationName: 'Storybook Organisation',
                        businessStreetAddress: {
                            line1: '200 Custom Street',
                            suburb: 'Sydney',
                            state: 'NSW',
                            postcode: '2000',
                        },
                    },
                },
            },
        },
        msw: {
            handlers: [reportRecipientOtherAddressHandler],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/report recipient organisation/i)).toBeVisible();
        await expect(canvas.getByText(/organisation name for report/i)).toBeVisible();
    },
};

export const PaymentDetailsStep: Story = {
    render: () => <PaymentDetails id='123' />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/payment-details'],
            formik: {
                initialValues: {
                    purchaseOrderNo: 'PO-4455',
                    invoiceSentTo: 'DifferentPerson',
                    contact: {
                        firstName: 'Taylor',
                        lastName: 'Nguyen',
                        email: 'accounts@example.com',
                        businessPhone: '02 7000 0000',
                        mobilePhone: '0400 111 111',
                    },
                },
            },
        },
    },
};

export const PaymentDetailsPostpaid: Story = {
    render: () => <PaymentDetails id='123' />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/payment-details'],
            formik: {
                initialValues: {
                    purchaseOrderNo: '',
                    invoiceSentTo: 'SamePerson',
                    contact: {
                        firstName: '',
                        lastName: '',
                        email: '',
                        businessPhone: '',
                        mobilePhone: '',
                    },
                },
            },
        },
        msw: {
            handlers: [
                reportRecipientHandler,
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

const deliveryAndReturnHandler = http.get('/api/accept-quote/:id/delivery-and-return', () => HttpResponse.json({
    acceptQuotePreInfo: {
        quotationIdNum: 'Q-2024-000456',
        receiptAndDispatchNA: false,
        nmiFacilityDeliveryInstructions: 'Please deliver to the loading dock at the rear of the building.',
    },
    rfqOrganisation: {
        streetAddress: {
            addressLine1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
        postalAddressSameAsStreetAddress: true,
        postalAddress: {
            addressLine1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
    },
    returnContactType: 'SamePerson',
    returnAddressType: 'BusinessAddress',
    returnMethod: 'ClientToArrange',
}));

export const DeliveryAndReturnStep: Story = {
    render: () => <DeliveryAndReturn id='123' />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/delivery-and-return'],
            formik: {
                initialValues: {
                    returnContactType: 'SamePerson',
                    returnAddressType: 'BusinessAddress',
                    returnOrganisationName: '',
                    returnMethod: 'ClientToArrange',
                },
            },
        },
        msw: { handlers: [deliveryAndReturnHandler] },
    },
};

const quotationSummaryHandler = http.get('/api/quote/get-quote-request-details', () => HttpResponse.json({
    quotationIdNum: 'Q-2024-000456',
    quotationTitle: 'Calibration Services',
    quotationItems: [],
    contact: {
        firstName: 'Taylor',
        lastName: 'Nguyen',
        email: 'taylor@example.com',
        phone: '02 7000 0000',
    },
}));

export const QuotationSummaryStep: Story = {
    render: () => <QuotationSummary cRMQuoteRequestId='crm-456' />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/quotation-summary'],
            formik: {
                initialValues: {},
            },
        },
        msw: { handlers: [quotationSummaryHandler] },
    },
};

const summaryAndAcceptHandler = http.get('/api/accept-quote/:id/summary-and-accept', () => HttpResponse.json({
    acceptQuotePreInfo: {
        quotationIdNum: 'Q-2024-000456',
        receiptAndDispatchNA: false,
        nmiCheckedByName: 'Dr. Jane Smith',
        nmiCheckedByJobTitle: 'Senior Metrologist',
        nmiCheckedByPhone: '02 8005 0000',
        nmiCheckedByEmail: 'jane.smith@industry.gov.au',
    },
    requestForQuote: {
        contact: {
            firstName: 'Taylor',
            lastName: 'Nguyen',
            role: 'Calibration Engineer',
            phone: '02 7000 0000',
            email: 'taylor@example.com',
        },
    },
    rfqOrganisation: {
        businessOrTradingName: 'Storybook Organisation',
        name: 'Storybook Organisation Pty Ltd',
        abn: '12 345 678 901',
        streetAddress: {
            line1: '100 Example Street',
            suburb: 'Canberra',
            state: 'ACT',
            postcode: '2601',
        },
    },
}));

export const SummaryAndAcceptStep: Story = {
    render: () => <SummaryAndAccept id='123' />,
    parameters: {
        portal: {
            initialEntries: ['/accept-quote/123/summary-and-accept'],
            formik: {
                initialValues: {
                    associatedDisputes: 'No',
                    acceptanceOfQuote: false,
                },
            },
        },
        msw: {
            handlers: [
                summaryAndAcceptHandler,
                deliveryAndReturnHandler,
                reportRecipientHandler,
                paymentDetailsHandler,
                quotationSummaryHandler,
            ],
        },
    },
    play: async ({ canvas }) => {
        const heading = await canvas.findByText(/Before you accept and submit our offer/i);
        await expect(heading).toBeVisible();
    },
};
