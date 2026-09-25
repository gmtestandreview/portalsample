import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FileProgress } from '@/api/web-api-client';
import ProgressFileList from '@/components/Progress/ProgressFileList';
import { FileStatus } from '@/routes/ta/types';

const renderList = (files: FileProgress[], onCancelFile?: (fileName: string) => void) => render(
    <ProgressFileList files={files} onCancelFile={onCancelFile} />,
);

describe('ProgressFileList', () => {
    it('renders byte, kilobyte, and megabyte upload progress rows', () => {
        renderList([
            {
                fileName: 'bytes.pdf',
                status: FileStatus.Uploading,
                bytesUploaded: 512,
                totalBytes: 900,
            },
            {
                fileName: 'kilobytes.pdf',
                status: FileStatus.Completed,
                bytesUploaded: 1024,
                totalBytes: 2048,
            },
            {
                fileName: 'megabytes.pdf',
                status: FileStatus.Failed,
                bytesUploaded: 1024 * 1024,
                totalBytes: 2 * 1024 * 1024,
            },
        ]);

        expect(screen.getByRole('progressbar', { name: 'Uploading bytes.pdf' })).toHaveAttribute('aria-valuenow', '57');
        expect(screen.getByText('512 B / 900 B')).toBeInTheDocument();
        expect(screen.getByText('2.00 KB')).toBeInTheDocument();
        expect(screen.getByText('1.00 KB / 2.00 KB')).toBeInTheDocument();
        expect(screen.getByText('2.00 MB')).toBeInTheDocument();
        expect(screen.getByText('1.00 MB / 2.00 MB')).toBeInTheDocument();
    });

    it('shows a cancel action for pending uploads and then marks the file as cancelling', async () => {
        const user = userEvent.setup();
        const onCancelFile = vi.fn();
        renderList([
            {
                fileName: 'manual.pdf',
                status: FileStatus.Pending,
                bytesUploaded: 100,
                totalBytes: 200,
            },
        ], onCancelFile);

        const cancelButton = screen.getByRole('button', { name: 'Cancel uploading manual.pdf' });
        await user.click(cancelButton);

        expect(onCancelFile).toHaveBeenCalledWith('manual.pdf');
        expect(screen.getByText('Cancelling...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel uploading manual.pdf' })).not.toBeInTheDocument();
    });

    it('omits progress and cancellation UI when a row has no byte totals', () => {
        renderList([
            {
                fileName: 'queued.pdf',
                status: FileStatus.Uploading,
            },
        ]);

        const item = screen.getByText('queued.pdf').closest('li');
        expect(item).not.toBeNull();
        expect(within(item!).queryByRole('progressbar')).not.toBeInTheDocument();
        expect(within(item!).queryByRole('button')).not.toBeInTheDocument();
    });
});
