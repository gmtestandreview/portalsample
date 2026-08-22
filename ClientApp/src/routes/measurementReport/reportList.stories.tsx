import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import type { PagedListOfInstrumentArtefactDto } from '../../api/web-api-client';
import { ReportStatus } from '../common/enums';
import { withPortalProviders } from '../../storybook/storybookHarness';
import ReportList from './reportList';

/**
 * `ReportList` renders the measurement-reports table for a single instrument/artefact:
 * report id, date, category, a status pill, and View report / Request recalibration
 * links. Withdrawn reports hide the View link. Paging is delegated to `setCurrentPage`.
 */
const pagedListArtefactData: PagedListOfInstrumentArtefactDto = {
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 2,
    items: [
        {
            tmasTcReportName: 'RPT-1001',
            tmasTcReportDate: new Date('2024-02-15T00:00:00'),
            tmasMeasurementReportCertificateRequired: 'Calibration certificate',
            tmasMeasurementCategoryName: 'Mass',
            tmasStatus: ReportStatus.Issued,
            tmasTcQuoteName: 'QR-1001',
            tmasPortalRequestId: 'P-1001',
        },
        {
            tmasTcReportName: 'RPT-1002',
            tmasTcReportDate: new Date('2023-11-02T00:00:00'),
            tmasMeasurementReportCertificateRequired: 'Test report',
            tmasMeasurementCategoryName: 'Volume',
            tmasStatus: ReportStatus.Withdrawn,
            tmasTcQuoteName: 'QR-1002',
            tmasPortalRequestId: 'P-1002',
        },
    ],
};

const meta = {
    title: 'Routes/MeasurementReport/ReportList',
    component: ReportList,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            initialEntries: ['/instrument-reports/INS-1'],
        },
    },
    args: {
        pagedListArtefactData,
        setCurrentPage: fn(),
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ReportList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('instReports-table')).toBeVisible();
        await expect(canvas.getByText('RPT-1001')).toBeVisible();
        // Issued report exposes a View report link…
        await expect(canvas.getByRole('link', { name: 'View report' })).toBeVisible();
        // …and every row offers recalibration.
        await expect(canvas.getAllByRole('link', { name: /request recalibration/i })).toHaveLength(2);
    },
};

export const WithdrawnHidesView: Story = {
    args: {
        pagedListArtefactData: {
            ...pagedListArtefactData,
            items: pagedListArtefactData.items?.slice(1),
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('RPT-1002')).toBeVisible();
        await expect(canvas.queryByRole('link', { name: 'View report' })).toBeNull();
    },
};
