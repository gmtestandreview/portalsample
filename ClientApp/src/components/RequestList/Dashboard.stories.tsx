import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { http, HttpResponse } from 'msw';
import { AccountStateCtx, AccountDispatchCtx } from '../../authentication/accountContext';
import type { AccountContextState } from '../../authentication/accountContext';
import RequestItem from './requestItem';
import { DashboardItemStatus } from '../../routes/common/enums';
import type { DashboardItemDto } from '../../api/web-api-client';

const noop = () => {};

const mockAccountContext: AccountContextState = {
    isLoading: false,
    details: {
        organisation: 'Storybook Organisation',
        trading: 'Storybook Trading Pty Ltd',
        branch: 'Main Branch',
        homeAccountId: 'mock-home-account-id',
        givenName: 'Test',
        familyName: 'User',
        email: 'test@example.com',
        abn: '00000000000',
        userAcceptedTermsOfUse: true,
        accountCreationCompleted: true,
        accountContactCompleted: true,
        currentTermsVersion: '1',
        defaultOrganisationId: 1,
        organisationIsCompleted: true,
        isDefaultOrganisation: true,
        showBranchSelector: false,
    },
    setAgree: noop,
    setCompleted: noop,
    setContactCompleted: noop,
    setDefaultOrganisationId: noop,
    setTargetOrganisation: noop,
    setOrganisationAndBranch: noop,
    setShowBranchSelector: noop,
    setShowRFQSelectModal: noop,
    setUserProfile: () => Promise.resolve(true),
};

const draftRequest: DashboardItemDto = {
    referenceId: 'RFQ-2024-001234',
    status: DashboardItemStatus.QuoteDrafted,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2024-03-15'),
    requestForQuote: {
        id: 1,
        manufacturer: 'Fluke',
        model: '87V',
        serialNumber: 'SN123456',
        measurementCategory: 'Electrical',
        artefactType: 'Multimeter',
        requestSubmitted: new Date('2024-03-15'),
        contactDetails: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
};

const quoteAvailableRequest: DashboardItemDto = {
    referenceId: 'RFQ-2024-000892',
    status: DashboardItemStatus.QuoteAvailable,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2024-02-20'),
    requestForQuote: {
        id: 2,
        manufacturer: 'Keysight',
        model: 'U1242C',
        serialNumber: 'MY12345678',
        measurementCategory: 'Electrical',
        artefactType: 'Handheld Multimeter',
        requestSubmitted: new Date('2024-01-10'),
        contactDetails: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
    quote: {
        quotationId: 'Q-2024-000456',
        artefactName: 'Keysight U1242C Handheld Multimeter',
        dateRequired: new Date('2024-03-01'),
        offerDate: new Date('2024-02-20'),
        validUntil: new Date('2024-04-20'),
        nmiContactDetails: {
            firstName: 'NMI',
            lastName: 'Officer',
            email: 'nmi@industry.gov.au',
            businessPhone: '02 6213 6800',
        },
    },
};

const reportIssuedRequest: DashboardItemDto = {
    referenceId: 'RFQ-2023-009012',
    status: DashboardItemStatus.ReportIssued,
    requestedFor: 'Storybook Organisation',
    lastUpdated: new Date('2023-11-28'),
    requestForQuote: {
        id: 3,
        manufacturer: 'Mettler Toledo',
        model: 'XPE205',
        serialNumber: 'B123456789',
        measurementCategory: 'Mass',
        artefactType: 'Analytical Balance',
        requestSubmitted: new Date('2023-09-01'),
        contactDetails: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            businessPhone: '02 1234 5678',
        },
        hideFromDashboard: false,
    },
    quote: {
        quotationId: 'Q-2023-007777',
        artefactName: 'Mettler Toledo XPE205 Analytical Balance',
        dateRequired: new Date('2023-09-15'),
        offerDate: new Date('2023-09-10'),
        validUntil: new Date('2023-11-10'),
        nmiContactDetails: {
            firstName: 'NMI',
            lastName: 'Officer',
            email: 'nmi@industry.gov.au',
            businessPhone: '02 6213 6800',
        },
    },
    report: {
        reportId: 'NMI/T/C/12345',
        invoiceNumber: 'INV-2023-009012',
        dateRequired: new Date('2023-09-15'),
        dateReceived: new Date('2023-09-16'),
        dateIssued: new Date('2023-11-25'),
        targetReportDate: new Date('2023-11-28'),
        returnMethod: 'Courier',
        dateDispatched: new Date('2023-11-28'),
        carrier: 'TNT',
        consignmentNote: 'CON123456789',
    },
};

const mockStateValue = { isLoading: mockAccountContext.isLoading, details: mockAccountContext.details };
const mockDispatchValue = {
    setAgree: mockAccountContext.setAgree,
    setCompleted: mockAccountContext.setCompleted,
    setContactCompleted: mockAccountContext.setContactCompleted,
    setDefaultOrganisationId: mockAccountContext.setDefaultOrganisationId,
    setTargetOrganisation: mockAccountContext.setTargetOrganisation,
    setOrganisationAndBranch: mockAccountContext.setOrganisationAndBranch,
    setShowBranchSelector: mockAccountContext.setShowBranchSelector,
    setShowRFQSelectModal: mockAccountContext.setShowRFQSelectModal,
    setUserProfile: mockAccountContext.setUserProfile,
};

const DashboardDecorator = (Story: ComponentType) => (
    <AccountStateCtx.Provider value={mockStateValue}>
        <AccountDispatchCtx.Provider value={mockDispatchValue}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <Story />
            </ul>
        </AccountDispatchCtx.Provider>
    </AccountStateCtx.Provider>
);

const meta = {
    title: 'Dashboard/RequestItem',
    component: RequestItem,
    parameters: {
        layout: 'padded',
        msw: {
            handlers: [
                http.get('/api/dashboard/*', () =>
                    HttpResponse.json({
                        items: [draftRequest, quoteAvailableRequest, reportIssuedRequest],
                        currentPage: 1,
                        totalPages: 1,
                        totalCount: 3,
                    })
                ),
            ],
        },
    },
    decorators: [DashboardDecorator],
} satisfies Meta<typeof RequestItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DraftRequest: Story = {
    args: {
        request: draftRequest,
    },
};

export const QuoteAvailable: Story = {
    args: {
        request: quoteAvailableRequest,
    },
};

export const ReportIssued: Story = {
    args: {
        request: reportIssuedRequest,
    },
};

export const AllRequestStates: Story = {
    args: { request: draftRequest },
    render: () => (
        <>
            <RequestItem request={draftRequest} />
            <RequestItem request={quoteAvailableRequest} />
            <RequestItem request={reportIssuedRequest} />
        </>
    ),
};
