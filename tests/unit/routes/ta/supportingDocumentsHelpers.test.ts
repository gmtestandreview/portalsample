import { describe, expect, it } from 'vitest';
import type { UploadProgress } from '../../../../ClientApp/src/api/web-api-client';
import { getFailedFileErrors } from '../../../../ClientApp/src/routes/ta/supportingDocumentsHelpers';
import { FileStatus } from '../../../../ClientApp/src/routes/ta/types';

describe(getFailedFileErrors, () => {
  it('returns no errors until the upload has finished', () => {
    expect.hasAssertions();

    const progress: UploadProgress = {
      percent: 50,
      files: [{ status: FileStatus.Failed, fileName: 'spec.pdf' }],
    };

    expect(getFailedFileErrors(progress)).toStrictEqual([]);
  });

  it('reports failed and cancelled files by name once complete', () => {
    expect.hasAssertions();

    const progress: UploadProgress = {
      percent: 100,
      files: [
        { status: FileStatus.Completed, fileName: 'ok.pdf' },
        { status: FileStatus.Failed, fileName: 'broken.pdf' },
        { status: FileStatus.Cancelled, fileName: 'stopped.pdf' },
      ],
    };

    expect(getFailedFileErrors(progress)).toStrictEqual([
      'Error uploading broken.pdf',
      'Upload cancelled for stopped.pdf',
    ]);
  });

  it('falls back to an empty name when a failed or cancelled file has no fileName', () => {
    expect.hasAssertions();

    const progress: UploadProgress = {
      percent: 100,
      files: [{ status: FileStatus.Failed }, { status: FileStatus.Cancelled }],
    };

    expect(getFailedFileErrors(progress)).toStrictEqual([
      'Error uploading ',
      'Upload cancelled for ',
    ]);
  });
});
