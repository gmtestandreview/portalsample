import preview from '../../../../.storybook/preview';
import ReportDetails from './reportDetails';
import NMIContactDetails from './nMIContactDetails';
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
      <NMIContactDetails quotationData={requestForQuoteDetailsFixture} />
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
      <NMIContactDetails quotationData={args.reportData} />
    </>
  ),
});
