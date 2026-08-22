import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import StatusPill from './StatusPill';
import QuoteStatusPill from './QuoteStatusPill';
import { DashboardItemStatus, QuoteStatus } from '../../routes/common/enums';

const meta = {
    title: 'Components/Pill',
    component: StatusPill,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardStatuses: Story = {
    args: {
        status: DashboardItemStatus.QuoteAvailable,
    },
    render: () => (
        <div className='d-flex gap-3 flex-wrap'>
            <StatusPill status={DashboardItemStatus.QuoteDrafted} />
            <StatusPill status={DashboardItemStatus.QuoteAvailable} />
            <StatusPill status={DashboardItemStatus.QuoteAccepted} />
            <StatusPill status={DashboardItemStatus.ReportIssued} />
            <StatusPill status={DashboardItemStatus.QuoteExpired} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Wait for useEffect to flush and badges to become visible
        const quoteAvailableBadge = await canvas.findByText(DashboardItemStatus.QuoteAvailable);
        await expect(quoteAvailableBadge).toBeVisible();

        const quoteAcceptedBadge = await canvas.findByText(DashboardItemStatus.QuoteAccepted);
        await expect(quoteAcceptedBadge).toBeVisible();
    },
};

export const QuoteStatuses: Story = {
    args: {
        status: DashboardItemStatus.QuoteAvailable,
    },
    render: () => (
        <div className='d-flex gap-3 flex-wrap'>
            <QuoteStatusPill status={QuoteStatus.QuoteAvailable} />
            <QuoteStatusPill status={QuoteStatus.QuoteAccepted} />
            <QuoteStatusPill status={QuoteStatus.ReportIssued} />
            <QuoteStatusPill status={QuoteStatus.QuoteDeclined} />
        </div>
    ),
};
