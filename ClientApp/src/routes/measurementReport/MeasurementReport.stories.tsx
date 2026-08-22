import type { Meta, StoryObj } from '@storybook/react-vite';
import ReportDetails from './reportDetails';
import NMIContactDetails from './nMIContactDetails';
import { withPortalProviders } from '../../storybook/storybookHarness';
import { requestForQuoteDetailsFixture } from '../../storybook/storybookFixtures';

const meta = {
    title: 'Routes/MeasurementReport',
    component: ReportDetails,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
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
            <NMIContactDetails quotationData={requestForQuoteDetailsFixture} />
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
            <NMIContactDetails quotationData={args.reportData} />
        </>
    ),
};
