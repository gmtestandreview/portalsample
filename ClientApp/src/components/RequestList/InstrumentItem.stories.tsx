import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ComponentType } from 'react';
import InstrumentItem from './instrumentItem';
import type { DashboardItemDto } from '../../api/web-api-client';
import { DashboardItemStatus } from '../../routes/common/enums';
import { withPortalProviders } from '../../storybook/storybookHarness';

const instrumentFixture: DashboardItemDto = {
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
            firstName: 'Taylor',
            lastName: 'Nguyen',
            email: 'taylor.nguyen@example.com',
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
    artefact: {
        tmasArtefactName: 'Mettler Toledo XPE205',
        tmasTcReportName: 'RPT-2023-12345',
        tmasTcReportDate: new Date('2023-11-25'),
        tmasMeasurementReportCertificateRequired: 'Measurement report only',
        tmasMeasurementCategoryName: 'Mass',
        tmasStatus: 'Report issued',
    },
};

// InstrumentItem renders <li> — must be wrapped in <ul> for valid HTML
const ListDecorator = (Story: ComponentType) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <Story />
    </ul>
);

const meta = {
    title: 'Dashboard/InstrumentItem',
    component: InstrumentItem,
    decorators: [withPortalProviders, ListDecorator],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof InstrumentItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReportsTab: Story = {
    args: {
        request: instrumentFixture,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Default tab is 'reports' — report table is rendered
        const reportsTable = await canvas.findByTestId('instReports-table');
        await expect(reportsTable).toBeVisible();
        // Report name appears in multiple cells — scope within the table
        const reportName = within(reportsTable).getAllByText('RPT-2023-12345')[0];
        await expect(reportName).toBeVisible();
    },
};

export const DetailsTab: Story = {
    args: {
        request: instrumentFixture,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        // Click the Details tab — react-bootstrap Tab.Container may not expose
        // role='tab' in jsdom; find by visible text instead.
        const detailsTab = canvas.getByText('Details');
        await user.click(detailsTab);
        // Details tab shows requestForQuote data — manufacturer appears in heading
        // and manufacturer row; take the first match (card heading)
        const manufacturers = await canvas.findAllByText(/mettler toledo/i);
        await expect(manufacturers[0]).toBeVisible();
    },
};
