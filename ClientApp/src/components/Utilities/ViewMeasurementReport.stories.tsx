import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, fn } from 'storybook/test';
import type { RequestForQuoteDetails } from '../../api/web-api-client';
import { withPortalProviders } from '../../storybook/storybookHarness';
import ViewMeasurementReport from './ViewMeasurementReport';

/**
 * `ViewMeasurementReport` wraps `ViewPdfButton` with the authenticated download
 * behaviour for an issued measurement report. On mount it requests the report's
 * file size; in the Storybook/jsdom environment the API call is not served, so the
 * component settles into its loaded state and renders the download affordance.
 */
const quotationData = {
    crmQuoteRequestId: 'QR-100245',
} as RequestForQuoteDetails;

const meta = {
    title: 'Components/Utilities/ViewMeasurementReport',
    component: ViewMeasurementReport,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'padded',
    },
    args: {
        text: 'View measurement report',
        quotationData,
        setFileError: fn(),
        setIsLoading: fn(),
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ViewMeasurementReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Once the file-size lookup settles, the download button renders.
        const button = await canvas.findByRole('button', { name: /view measurement report/i });
        await expect(button).toBeVisible();
    },
};
