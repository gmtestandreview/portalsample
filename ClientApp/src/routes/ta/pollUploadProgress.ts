import type { ProgressClient, UploadProgress } from '../../api/web-api-client';
import AppLogger from '../../instrumentation/AppLogger';

/**
 * Backoff between failed progress polls. Without it a persistently failing endpoint turns the
 * retry path into a tight loop that pegs a core and hammers the failing service.
 */
export const PROGRESS_RETRY_DELAY_MS = 2000;

const INITIAL_PERCENT = -1;

const isFinished = (data: UploadProgress) =>
  data.status === 'Completed' || data.status === 'CompletedWithErrors';

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface PollUploadProgressOptions {
  /** Client with its auth token already set. */
  client: ProgressClient;
  uploadId: string;
  signal: AbortSignal;
  onProgress: (data: UploadProgress) => void;
  onFinished: () => void;
}

/**
 * Long-polls upload progress until the upload finishes or `signal` aborts.
 *
 * Each poll depends on the previous result (`lastPercent`) and on the backoff elapsing, so the
 * polls are inherently sequential. They are expressed as self-scheduling calls rather than an
 * `await` inside a loop (Sonar S9382), which would read as a missed chance to parallelise.
 */
export const pollUploadProgress = async ({
  client,
  uploadId,
  signal,
  onProgress,
  onFinished,
}: PollUploadProgressOptions): Promise<void> => {
  const poll = async (lastPercent: number): Promise<void> => {
    if (signal.aborted) return;

    let data: UploadProgress;
    try {
      data = await client.getProgress(uploadId, lastPercent, signal);
    } catch {
      if (signal.aborted) return;
      await wait(PROGRESS_RETRY_DELAY_MS);
      return poll(lastPercent);
    }

    onProgress(data);

    if (isFinished(data)) {
      onFinished();
      client.deleteProgressStatistics(uploadId).catch((error) => {
        AppLogger.error(
          'Failed to delete progress statistics',
          error as Error,
          { uploadId }
        );
      });
      return;
    }

    return poll(data.percent!);
  };

  await poll(INITIAL_PERCENT);
};
