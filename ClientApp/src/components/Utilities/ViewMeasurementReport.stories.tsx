import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { RequestForQuoteDetails } from '../../api/web-api-client.ts';
import { withPortalProviders } from '../../storybook/storybookHarness.tsx';
import ViewMeasurementReport from './ViewMeasurementReport.tsx';

/**
 * `ViewMeasurementReport` wraps `ViewPdfButton` with the authenticated download
 * behaviour for an issued measurement report. On mount it requests the report's
 * file size from the endpoint-specific MSW metadata fixture, then requests the
 * downloadable PDF branch when the user activates the button.
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
} satisfies Meta<typeof ViewMeasurementReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', {
      name: /view measurement report/iu,
    });
    await expect(button).toBeVisible();
    await expect(canvas.getByText(/PDF file size 2\.00Kb/iu)).toBeVisible();

    await userEvent.click(button);

    await waitFor(() => expect(args.setIsLoading).toHaveBeenCalledWith(false));
    await expect(args.setFileError).toHaveBeenLastCalledWith(false);
  },
};
