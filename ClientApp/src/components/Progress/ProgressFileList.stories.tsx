import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import type { FileProgress } from '../../api/web-api-client';
import { FileStatus } from '../../routes/ta/types';
import ProgressFileList from './ProgressFileList';

/**
 * `ProgressFileList` renders the multi-file upload tray used by the type-approval
 * attachment flow. Each row shows the file name, size, a per-file progress bar, and
 * an in-flight cancel control for files that are still `Uploading` or `Pending`.
 */
const files: FileProgress[] = [
    {
        fileName: 'calibration-certificate.pdf',
        status: FileStatus.Uploading,
        bytesUploaded: 524_288,
        totalBytes: 1_048_576,
    },
    {
        fileName: 'instrument-photo.jpg',
        status: FileStatus.Pending,
        bytesUploaded: 0,
        totalBytes: 2_097_152,
    },
    {
        fileName: 'declaration.docx',
        status: FileStatus.Completed,
        bytesUploaded: 32_000,
        totalBytes: 32_000,
    },
];

const meta = {
    title: 'Components/Progress/ProgressFileList',
    component: ProgressFileList,
    parameters: {
        layout: 'padded',
    },
    args: {
        files,
        onCancelFile: fn(),
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ProgressFileList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Uploading: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('calibration-certificate.pdf')).toBeVisible();
        await expect(canvas.getByText('instrument-photo.jpg')).toBeVisible();
        // A cancellable (Uploading) file exposes a cancel button.
        await expect(
            canvas.getByRole('button', { name: /cancel uploading calibration-certificate\.pdf/i }),
        ).toBeVisible();
    },
};

export const CancelInvokesCallback: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const user = userEvent.setup();
        const cancel = canvas.getByRole('button', { name: /cancel uploading calibration-certificate\.pdf/i });
        await user.click(cancel);
        await expect(args.onCancelFile).toHaveBeenCalledWith('calibration-certificate.pdf');
        // Row switches to the "Cancelling..." state once clicked.
        await expect(canvas.getByText(/cancelling/i)).toBeVisible();
    },
};

export const Empty: Story = {
    args: {
        files: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: /cancel uploading/i })).toBeNull();
    },
};
