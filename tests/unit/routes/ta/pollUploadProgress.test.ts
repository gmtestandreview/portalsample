import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProgressClient,
  UploadProgress,
} from '../../../../ClientApp/src/api/web-api-client';
import {
  PROGRESS_RETRY_DELAY_MS,
  pollUploadProgress,
} from '../../../../ClientApp/src/routes/ta/pollUploadProgress';

const appLoggerError = vi.hoisted(() => vi.fn());
vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
  default: { error: appLoggerError },
}));

const makeClient = () => {
  const getProgress = vi.fn();
  const deleteProgressStatistics = vi.fn().mockResolvedValue(undefined);
  const client = {
    getProgress,
    deleteProgressStatistics,
  } as unknown as ProgressClient;
  return { client, getProgress, deleteProgressStatistics };
};

describe('pollUploadProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    appLoggerError.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('feeds each poll the previous percent and stops on completion', async () => {
    const { client, getProgress, deleteProgressStatistics } = makeClient();
    getProgress
      .mockResolvedValueOnce({ percent: 40, status: 'InProgress' })
      .mockResolvedValueOnce({ percent: 100, status: 'Completed' });
    const onProgress = vi.fn();
    const onFinished = vi.fn();
    const { signal } = new AbortController();

    await pollUploadProgress({
      client,
      uploadId: 'u1',
      signal,
      onProgress,
      onFinished,
    });

    expect(getProgress.mock.calls.map(([, percent]) => percent)).toEqual([
      -1, 40,
    ]);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onFinished).toHaveBeenCalledOnce();
    expect(deleteProgressStatistics).toHaveBeenCalledWith('u1');
  });

  it('treats CompletedWithErrors as finished', async () => {
    const { client, getProgress } = makeClient();
    getProgress.mockResolvedValue({
      percent: 100,
      status: 'CompletedWithErrors',
    } satisfies UploadProgress);
    const onFinished = vi.fn();

    await pollUploadProgress({
      client,
      uploadId: 'u1',
      signal: new AbortController().signal,
      onProgress: vi.fn(),
      onFinished,
    });

    expect(onFinished).toHaveBeenCalledOnce();
  });

  it('logs a failed statistics cleanup without rejecting', async () => {
    const { client, getProgress, deleteProgressStatistics } = makeClient();
    getProgress.mockResolvedValue({ percent: 100, status: 'Completed' });
    deleteProgressStatistics.mockRejectedValue(new Error('gone'));

    await pollUploadProgress({
      client,
      uploadId: 'u1',
      signal: new AbortController().signal,
      onProgress: vi.fn(),
      onFinished: vi.fn(),
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(appLoggerError).toHaveBeenCalledWith(
      'Failed to delete progress statistics',
      expect.any(Error),
      { uploadId: 'u1' }
    );
  });

  it('backs off then retries with the same percent after a failed poll', async () => {
    const { client, getProgress } = makeClient();
    getProgress
      .mockResolvedValueOnce({ percent: 40, status: 'InProgress' })
      .mockRejectedValueOnce(new Error('blip'))
      .mockResolvedValueOnce({ percent: 100, status: 'Completed' });

    const done = pollUploadProgress({
      client,
      uploadId: 'u1',
      signal: new AbortController().signal,
      onProgress: vi.fn(),
      onFinished: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(PROGRESS_RETRY_DELAY_MS - 1);
    expect(getProgress).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await done;

    expect(getProgress.mock.calls.map(([, percent]) => percent)).toEqual([
      -1, 40, 40,
    ]);
  });

  it('does not poll when already aborted', async () => {
    const { client, getProgress } = makeClient();
    const controller = new AbortController();
    controller.abort();

    await pollUploadProgress({
      client,
      uploadId: 'u1',
      signal: controller.signal,
      onProgress: vi.fn(),
      onFinished: vi.fn(),
    });

    expect(getProgress).not.toHaveBeenCalled();
  });

  it('exits without retrying when a failed poll was caused by abort', async () => {
    const { client, getProgress } = makeClient();
    const controller = new AbortController();
    getProgress.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error('aborted'));
    });

    await pollUploadProgress({
      client,
      uploadId: 'u1',
      signal: controller.signal,
      onProgress: vi.fn(),
      onFinished: vi.fn(),
    });

    expect(getProgress).toHaveBeenCalledOnce();
  });
});
