import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, waitFor } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import InstrMeasurementReport from './indexList';

/**
 * `InstrMeasurementReport` (the instrument-reports index route) is the banner + shell
 * around an instrument/artefact's measurement-report list. The endpoint-specific
 * Storybook fixture supplies one issued report so the story verifies the complete
 * loaded route rather than only its static shell.
 */
const meta = {
    title: 'Routes/MeasurementReport/InstrumentReports',
    component: InstrMeasurementReport,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            routePath: '/instrument-reports/:id',
            initialEntries: ['/instrument-reports/INS-1'],
        },
    },
} satisfies Meta<typeof InstrMeasurementReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The banner title renders the :id route param. It was empty in every story,
        // because the preview decorator used to mount everything under `path: '*'`.
        await expect(canvas.getByRole('heading', { level: 1, name: 'INS-1' })).toBeVisible();
        await expect(canvas.getByText('Testing and calibration service')).toBeVisible();
        await expect(canvas.getByTestId('go-to-dashboard-button')).toBeVisible();
        const reportRegion = canvasElement.querySelector('[aria-live="polite"]');
        await waitFor(() => expect(reportRegion).toHaveAttribute('aria-busy', 'false'));
        await expect(canvas.getByTestId('instReports-table')).toBeVisible();
        await expect(canvas.getByText('RPT-1001')).toBeVisible();
    },
};
