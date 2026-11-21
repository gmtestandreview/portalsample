import preview from '../../../../.storybook/preview';
import ReportDetails from './reportDetails';
import NMIContactDetails from '../common/NMIContactDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';

const meta = preview.meta({
  title: 'Routes/MeasurementReport',
  component: ReportDetails,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
  },
});

export const ReportView = meta.story({
  args: {
    reportData: requestForQuoteDetailsFixture,
    fileError: false,
  },
  render: () => (
    <>
      <ReportDetails
        reportData={requestForQuoteDetailsFixture}
        fileError={false}
      />
      <NMIContactDetails
        heading='Contact your NMI test officer if you have any questions about the report outcomes.'
        quotationData={requestForQuoteDetailsFixture}
      />
    </>
  ),
});

export const FileError = meta.story({
  args: {
    reportData: requestForQuoteDetailsFixture,
    fileError: true,
  },
  render: (args) => (
    <>
      <ReportDetails {...args} />
      <NMIContactDetails
        heading='Contact your NMI test officer if you have any questions about the report outcomes.'
        quotationData={args.reportData}
      />
    </>
  ),
});
