import type { Meta, StoryObj } from '@storybook/react-vite';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures.ts';
import { withPortalProviders } from '../../storybook/storybookHarness.tsx';
import NmiContactDetails from './nMIContactDetails.tsx';
import ReportDetails from './reportDetails.tsx';

const meta = {
  title: 'Routes/MeasurementReport',
  component: ReportDetails,
  decorators: [withPortalProviders],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ReportDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReportView: Story = {
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
      <NmiContactDetails quotationData={requestForQuoteDetailsFixture} />
    </>
  ),
};

export const FileError: Story = {
  args: {
    reportData: requestForQuoteDetailsFixture,
    fileError: true,
  },
  render: (args) => (
    <>
      <ReportDetails {...args} />
      <NmiContactDetails quotationData={args.reportData} />
    </>
  ),
};
