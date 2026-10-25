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

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: appLoggerError },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const makeClient = () => {
  const getProgress = vi.fn();
  const deleteProgressStatistics = vi.fn().mockResolvedValue(undefined);
  const client = {
    getProgress,
    deleteProgressStatistics,
  } as unknown as ProgressClient;
  return { client, getProgress, deleteProgressStatistics };
};

describe(pollUploadProgress, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    appLoggerError.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('feeds each poll the previous percent and stops on completion', async () => {
    expect.assertions(4);
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
    expect(onFinished).toHaveBeenCalledExactlyOnceWith();
    expect(deleteProgressStatistics).toHaveBeenCalledWith('u1');
  });
});

describe(pollUploadProgress, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    appLoggerError.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('treats CompletedWithErrors as finished', async () => {
    expect.assertions(1);
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

    expect(onFinished).toHaveBeenCalledExactlyOnceWith();
  });
});
