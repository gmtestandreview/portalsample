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
    renderList(
      [
        {
          fileName: 'queued.pdf',
          status: FileStatus.Uploading,
        },
      ],
      onCancelFile,
    );

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

  it('preserves unnamed row identity across freshly parsed polling responses', () => {
    expect.hasAssertions();

    const firstResponse = {
      status: FileStatus.Uploading,
      blobUrl: 'blob:unnamed-upload',
      bytesUploaded: 100,
      totalBytes: 200,
    };
    const { rerender } = renderList([firstResponse]);
    const initialItem = defined(
      screen.getByRole('progressbar', { name: 'Uploading file' }).closest('li'),
      'unnamed upload item',
    );

    rerender(
      <ProgressFileList files={[{ ...firstResponse, bytesUploaded: 150 }]} />,
    );

    expect(
      screen.getByRole('progressbar', { name: 'Uploading file' }).closest('li'),
    ).toBe(initialItem);
  });

  it('keeps duplicate rows independently cancellable across fresh polling responses', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onCancelFile = vi.fn<(fileName: string) => void>();
    const firstResponse = [
      {
        fileName: 'duplicate.pdf',
        blobUrl: 'blob:duplicate',
        status: FileStatus.Pending,
        bytesUploaded: 100,
        totalBytes: 200,
      },
      {
        fileName: 'duplicate.pdf',
        blobUrl: 'blob:duplicate',
        status: FileStatus.Pending,
        bytesUploaded: 150,
        totalBytes: 200,
      },
    ];
    const { rerender } = renderList(firstResponse, onCancelFile);
    const initialRows = screen.getAllByRole('listitem');

    const duplicateButtons = screen.getAllByRole('button', {
      name: 'Cancel uploading duplicate.pdf',
    });
    const dataTestIds = duplicateButtons.map((button) =>
      button.getAttribute('data-testid'),
    );
    const ids = duplicateButtons.map((button) => button.id);
    const names = duplicateButtons.map((button) => button.getAttribute('name'));
    const domAttributes = [...dataTestIds, ...ids, ...names];

    expect({
      rowCount: initialRows.length,
      cancelButtonCount: duplicateButtons.length,
      uniqueDomAttributeCounts: {
        dataTestIds: new Set(dataTestIds).size,
        ids: new Set(ids).size,
        names: new Set(names).size,
      },
      domAttributesAreSafe: domAttributes.every((attribute) =>
        /^cancel-button-file-progress-[0-9a-f]+-\d+$/.test(attribute ?? ''),
      ),
      accessibleLabels: duplicateButtons.map((button) =>
        button.getAttribute('aria-label'),
      ),
    }).toStrictEqual({
      rowCount: 2,
      cancelButtonCount: 2,
      uniqueDomAttributeCounts: { dataTestIds: 2, ids: 2, names: 2 },
      domAttributesAreSafe: true,
      accessibleLabels: [
        'Cancel uploading duplicate.pdf',
        'Cancel uploading duplicate.pdf',
      ],
    });

    await user.click(
      defined(duplicateButtons[0], 'first duplicate cancel button'),
    );

    expect({
      callbackCalls: onCancelFile.mock.calls,
      cancellingCount: screen.getAllByText('Cancelling...').length,
      remainingButtonCount: screen.getAllByRole('button', {
        name: 'Cancel uploading duplicate.pdf',
      }).length,
    }).toStrictEqual({
      callbackCalls: [['duplicate.pdf']],
      cancellingCount: 1,
      remainingButtonCount: 1,
    });

    rerender(
      <ProgressFileList
        files={firstResponse.map((file, index) => ({
          ...file,
          bytesUploaded: 125 + index * 25,
        }))}
        onCancelFile={onCancelFile}
      />,
    );

    const updatedRows = screen.getAllByRole('listitem');

    expect(
      updatedRows.map((row, index) => row === initialRows.at(index)),
    ).toStrictEqual([true, true]);

    expect({
      cancellingCount: screen.getAllByText('Cancelling...').length,
      remainingButtonCount: screen.getAllByRole('button', {
        name: 'Cancel uploading duplicate.pdf',
      }).length,
    }).toStrictEqual({ cancellingCount: 1, remainingButtonCount: 1 });
  });

  it('follows the cancelled row when fresh duplicate rows reorder', async () => {
    expect.hasAssertions();

    const user = userEvent.setup();
    const onCancelFile = vi.fn<(fileName: string) => void>();
    const firstResponse = [
      {
        fileName: 'duplicate.pdf',
        blobUrl: 'blob:duplicate-a',
        status: FileStatus.Pending,
        bytesUploaded: 100,
        totalBytes: 200,
      },
      {
        fileName: 'duplicate.pdf',
        blobUrl: 'blob:duplicate-b',
        status: FileStatus.Pending,
        bytesUploaded: 150,
        totalBytes: 200,
      },
    ];
    const { rerender } = renderList(firstResponse, onCancelFile);
    const initialRows = screen.getAllByRole('listitem');
    const initialButtons = screen.getAllByRole('button', {
      name: 'Cancel uploading duplicate.pdf',
    });
    const clickedButton = defined(
      initialButtons.at(0),
      'first duplicate cancel button',
    );
    const otherButton = defined(
      initialButtons.at(1),
      'second duplicate cancel button',
    );
    const clickedRow = defined(initialRows.at(0), 'first duplicate row');
    const otherRow = defined(initialRows.at(1), 'second duplicate row');

    await user.click(clickedButton);

    rerender(
      <ProgressFileList
        files={[
          defined(firstResponse.at(1), 'second duplicate file'),
          {
            ...defined(firstResponse.at(0), 'first duplicate file'),
            bytesUploaded: 125,
          },
        ]}
        onCancelFile={onCancelFile}
      />,
    );

    const updatedRows = screen.getAllByRole('listitem');
    const remainingButton = screen.getByRole('button', {
      name: 'Cancel uploading duplicate.pdf',
    });
    const cancellationRow = defined(
      screen.getByText('Cancelling...').closest('li'),
      'cancelled duplicate row',
    );

    expect({
      callbackCalls: onCancelFile.mock.calls,
      rowOrder: updatedRows.map((row) =>
        row === clickedRow
          ? 'cancelled'
          : row === otherRow
            ? 'other'
            : 'unknown',
      ),
      cancellationFollowsClickedRow: cancellationRow === clickedRow,
      remainingButtonId: remainingButton.id,
    }).toStrictEqual({
      callbackCalls: [['duplicate.pdf']],
      rowOrder: ['other', 'cancelled'],
      cancellationFollowsClickedRow: true,
      remainingButtonId: otherButton.id,
    });
  });

  it('keeps DOM identifiers unique for variable-width encoding collisions', () => {
    expect.hasAssertions();

    const collidingNames = ['\u{10001}\u{1001}.pdf', '\u{1000}\u{11001}.pdf'];
    renderList(
      collidingNames.map((fileName) => ({
        fileName,
        status: FileStatus.Pending,
      })),
      vi.fn(),
    );

    const buttons = screen.getAllByRole('button');
    const dataTestIds = buttons.map((button) =>
      button.getAttribute('data-testid'),
    );
    const ids = buttons.map((button) => button.id);
    const names = buttons.map((button) => button.getAttribute('name'));

    expect({
      buttonCount: buttons.length,
      uniqueDataTestIdCount: new Set(dataTestIds).size,
      uniqueIdCount: new Set(ids).size,
      uniqueNameCount: new Set(names).size,
      accessibleLabels: buttons.map((button) =>
        button.getAttribute('aria-label'),
      ),
    }).toStrictEqual({
      buttonCount: 2,
      uniqueDataTestIdCount: 2,
      uniqueIdCount: 2,
      uniqueNameCount: 2,
      accessibleLabels: collidingNames.map(
        (fileName) => `Cancel uploading ${fileName}`,
      ),
    });
  });

  it('keeps multiple fully unnamed rows distinct across fresh polling responses', () => {
    expect.hasAssertions();

    const firstResponse = [
      {
        status: FileStatus.Uploading,
        bytesUploaded: 10,
        totalBytes: 100,
      },
      {
        status: FileStatus.Uploading,
        bytesUploaded: 20,
        totalBytes: 100,
      },
      {
        status: FileStatus.Uploading,
        bytesUploaded: 30,
        totalBytes: 100,
      },
    ];
    const { rerender } = renderList(firstResponse);
    const initialRows = screen.getAllByRole('listitem');

    expect({
      rowCount: initialRows.length,
      progressbarCount: screen.getAllByRole('progressbar', {
        name: 'Uploading file',
      }).length,
    }).toStrictEqual({ rowCount: 3, progressbarCount: 3 });

    rerender(
      <ProgressFileList
        files={firstResponse.map((file) => ({
          ...file,
          bytesUploaded: file.bytesUploaded + 10,
        }))}
      />,
    );

    const updatedRows = screen.getAllByRole('listitem');

    expect({
      rowCount: updatedRows.length,
      sameRows: updatedRows.map((row, index) => row === initialRows.at(index)),
      progressValues: screen
        .getAllByRole('progressbar', { name: 'Uploading file' })
        .map((progressbar) => progressbar.getAttribute('aria-valuenow')),
    }).toStrictEqual({
      rowCount: 3,
      sameRows: [true, true, true],
      progressValues: ['20', '30', '40'],
    });
  });
});
