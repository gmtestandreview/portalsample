import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import ProgressBar from './ProgressBar';

/**
 * `ProgressBar` is the single-file upload progress indicator: a labelled bar that
 * pairs a status caption with a live percentage. It is presentational — the percent
 * and status are driven entirely by props.
 */
const meta = {
    title: 'Components/Progress/ProgressBar',
    component: ProgressBar,
    parameters: {
        layout: 'padded',
    },
    args: {
        percent: 42,
        status: 'Uploading',
    },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // A progressbar has to carry its own name and value: the visible caption and
        // percentage sit inside the role, so a screen reader announces "progress bar" and
        // nothing else without them.
        const bar = canvas.getByRole('progressbar', { name: 'Uploading' });
        await expect(bar).toBeVisible();
        await expect(bar).toHaveAttribute('aria-valuenow', '42');
        await expect(canvas.getByText('Uploading')).toBeVisible();
        await expect(canvas.getByText(/42%/)).toBeVisible();
    },
};

export const JustStarted: Story = {
    args: {
        percent: 0,
        status: 'Preparing upload',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/0%/)).toBeVisible();
    },
};

export const Complete: Story = {
    args: {
        percent: 100,
        status: 'Upload complete',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/100%/)).toBeVisible();
    },
};
