import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defined } from '../../helpers/defined';
import type { FileProgress } from '@/api/web-api-client';
import ProgressFileList from '@/components/Progress/ProgressFileList';
import { FileStatus } from '@/routes/ta/types';

const renderList = (
  files: FileProgress[],
  onCancelFile?: (fileName: string) => void,
) =>
  render(
    <ProgressFileList
      files={files}
      {...(onCancelFile === undefined ? {} : { onCancelFile })}
    />,
  );

describe('progress file list', () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.hasAssertions();

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

    expect({
      percent: screen
        .getByRole('progressbar', { name: 'Uploading bytes.pdf' })
        .getAttribute('aria-valuenow'),
      labels: [
        '512 B / 900 B',
        '2.00 KB',
        '1.00 KB / 2.00 KB',
        '2.00 MB',
        '1.00 MB / 2.00 MB',
      ].map((label) => screen.getByText(label).textContent),
    }).toStrictEqual({
      percent: '57',
      labels: [
        '512 B / 900 B',
        '2.00 KB',
        '1.00 KB / 2.00 KB',
        '2.00 MB',
        '1.00 MB / 2.00 MB',
      ],
    });
  });

  it('shows a cancel action for pending uploads and then marks the file as cancelling', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onCancelFile = vi.fn<(fileName: string) => void>();
    renderList(
      [
        {
          fileName: 'manual.pdf',
          status: FileStatus.Pending,
          bytesUploaded: 100,
          totalBytes: 200,
        },
      ],
      onCancelFile,
    );

    const cancelButton = screen.getByRole('button', {
      name: 'Cancel uploading manual.pdf',
    });
    await user.click(cancelButton);

    expect(onCancelFile).toHaveBeenCalledWith('manual.pdf');
    expect(screen.getByText('Cancelling...')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel uploading manual.pdf' }),
    ).not.toBeInTheDocument();
  });

  it('does not treat inherited object keys as already cancelling', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onCancelFile = vi.fn<(fileName: string) => void>();
    renderList(
      [
        {
          fileName: 'constructor',
          status: FileStatus.Pending,
          bytesUploaded: 100,
          totalBytes: 200,
        },
      ],
      onCancelFile,
    );

    const cancelButton = screen.getByRole('button', {
      name: 'Cancel uploading constructor',
    });
    await user.click(cancelButton);

    expect(onCancelFile).toHaveBeenCalledWith('constructor');
    expect(screen.getByText('Cancelling...')).toBeInTheDocument();
  });

  it('omits the progress bar but retains cancellation for an upload without byte totals', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onCancelFile = vi.fn<(fileName: string) => void>();
    renderList([
      {
        fileName: 'queued.pdf',
        status: FileStatus.Uploading,
      },
    ], onCancelFile);

    const item = defined(
      screen.getByText('queued.pdf').closest('li'),
      'queued file list item',
    );

    expect(within(item).queryByRole('progressbar')).not.toBeInTheDocument();

    const cancelButton = within(item).getByRole('button', {
      name: 'Cancel uploading queued.pdf',
    });
    await user.click(cancelButton);

    expect(onCancelFile).toHaveBeenCalledWith('queued.pdf');
    expect(screen.getByText('Cancelling...')).toBeInTheDocument();
  });

  it('labels the progress row generically when a file has no name', () => {
    expect.hasAssertions();

    renderList([
      {
        status: FileStatus.Uploading,
        bytesUploaded: 100,
        totalBytes: 200,
      },
    ]);

    expect(
      screen.getByRole('progressbar', { name: 'Uploading file' }),
    ).toBeInTheDocument();
  });
});
