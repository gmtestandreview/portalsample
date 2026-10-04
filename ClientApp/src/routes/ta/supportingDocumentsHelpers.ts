import { FileStatus, type TASupportingDocumentsProps } from './types';

export const handleAlertScroll = () => {
  setTimeout(() => {
    const summaryRef: HTMLElement = document.querySelector(
      '#form-error-summary-custom'
    ) as HTMLElement;
    summaryRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    summaryRef?.focus();
  }, 100);
};

/** Messages for files that failed or were cancelled once the upload has finished. */
export const getFailedFileErrors = (
  progress: TASupportingDocumentsProps['progress']
) => {
  if (progress?.percent !== 100 || !Array.isArray(progress.files)) return [];
  return progress.files
    .filter(
      (f) => f.status === FileStatus.Failed || f.status === FileStatus.Cancelled
    )
    .map((f) =>
      f.status === FileStatus.Cancelled
        ? `Upload cancelled for ${f.fileName}`
        : `Error uploading ${f.fileName}`
    );
};
