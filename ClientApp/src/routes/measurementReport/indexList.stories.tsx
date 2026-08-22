import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { withPortalProviders } from '../../storybook/storybookHarness';
import InstrMeasurementReport from './indexList';

/**
 * `InstrMeasurementReport` (the instrument-reports index route) is the banner + shell
 * around an instrument/artefact's measurement-report list. It loads the report list for
 * the active organisation; the report table appears once data resolves. In Storybook
 * the report API is not served, so the story documents the framed empty shell.
 */
const meta = {
    title: 'Routes/MeasurementReport/InstrumentReports',
    component: InstrMeasurementReport,
    decorators: [withPortalProviders],
    parameters: {
        layout: 'fullscreen',
        portal: {
            authenticated: true,
            initialEntries: ['/instrument-reports/INS-1'],
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof InstrMeasurementReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Testing and calibration service')).toBeVisible();
        await expect(canvas.getByTestId('go-to-dashboard-button')).toBeVisible();
    },
};
