import preview from '../../../../.storybook/preview';
import { within, expect } from 'storybook/test';
import ProgressBar from './ProgressBar';

/**
 * `ProgressBar` is the single-file upload progress indicator: a labelled bar that
 * pairs a status caption with a live percentage. It is presentational — the percent
 * and status are driven entirely by props.
 */
const meta = preview.meta({
  title: 'Components/Progress/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
  },
  args: {
    percent: 42,
    status: 'Uploading',
  },
});


export const InProgress = meta.story({
  play: async ({
    canvasElement,
  }) => {
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
});

export const JustStarted = meta.story({
  args: {
    percent: 0,
    status: 'Preparing upload',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/0%/)).toBeVisible();
  },
});

export const Complete = meta.story({
  args: {
    percent: 100,
    status: 'Upload complete',
  },
  play: async ({
    canvasElement,
  }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/100%/)).toBeVisible();
  },
});
