import { render, screen, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

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

describe(ProgressFileList, () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.assertions(1);
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
    expect(
      screen.getByRole('progressbar', { name: 'Uploading bytes.pdf' }),
    ).toHaveAttribute('aria-valuenow', '57');
  });
});

describe(ProgressFileList, () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.assertions(1);
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
    expect(screen.getByText('512 B / 900 B')).toBeInTheDocument();
  });
});

describe(ProgressFileList, () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.assertions(1);
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
    expect(screen.getByText('2.00 KB')).toBeInTheDocument();
  });
});

describe(ProgressFileList, () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.assertions(1);
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
    expect(screen.getByText('1.00 KB / 2.00 KB')).toBeInTheDocument();
  });
});

describe(ProgressFileList, () => {
  it('renders byte, kilobyte, and megabyte upload progress rows', () => {
    expect.assertions(1);
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
    expect(screen.getByText('2.00 MB')).toBeInTheDocument();
  });
});
