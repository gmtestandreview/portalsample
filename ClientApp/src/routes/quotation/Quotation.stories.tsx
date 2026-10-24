import preview from '../../../../.storybook/preview';
import QuoteDetails from './quoteDetails';
import NMIContactDetails from './nMIContactDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';

const meta = preview.meta({
  title: 'Routes/Quotation',
  component: QuoteDetails,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
  },
});


export const QuoteSummary = meta.story({
  args: {
    quotationData: requestForQuoteDetailsFixture,
    isSummary: false,
    firstName: 'Taylor',
    lastName: 'Nguyen',
    fileError: false,
  },
  render: () => (
    <>
      <QuoteDetails
        quotationData={requestForQuoteDetailsFixture}
        isSummary={false}
        firstName='Taylor'
        lastName='Nguyen'
        fileError={false}
      />
      <NMIContactDetails quotationData={requestForQuoteDetailsFixture} />
    </>
  ),
});

export const ExpiredNoDelivery = meta.story({
  args: {
    quotationData: {
      ...requestForQuoteDetailsFixture,
      quoteRequestStatus: 'Quote - Expired',
      receiptandDispatchNA: true,
    },
    isSummary: false,
    firstName: 'Taylor',
    lastName: 'Nguyen',
    fileError: false,
  },
  render: (args) => (
    <>
      <QuoteDetails {...args} />
      <NMIContactDetails quotationData={args.quotationData} />
    </>
  ),
});
