import preview from '../../../../.storybook/preview';
import { expect, within } from 'storybook/test';
import StatusPill from './StatusPill';
import QuoteStatusPill from './QuoteStatusPill';
import { DashboardItemStatus, QuoteStatus } from '../../routes/common/enums';

const meta = preview.meta({
  title: 'Components/Pill',
  component: StatusPill,
  parameters: {
    layout: 'centered',
  },
});


export const DashboardStatuses = meta.story({
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
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    // Wait for useEffect to flush and badges to become visible
    const quoteAvailableBadge = await canvas.findByText(
      'Quote offer is available',
    );

    await expect(quoteAvailableBadge).toBeVisible();

    const quoteAcceptedBadge = await canvas.findByText(
      'Quote offer is accepted',
    );

    await expect(quoteAcceptedBadge).toBeVisible();
  },
});

export const QuoteStatuses = meta.story({
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
});
