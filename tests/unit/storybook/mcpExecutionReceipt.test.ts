import { describe, expect, it } from 'vitest';

type ReceiptModule = {
  normalizeMcpReceipt(input: {
    requestId: number | string;
    requestedStoryIds: string[];
    response: unknown;
    freezeId: string;
    producerId: string;
    inputDigest: string;
    producerIdentityDigest: string;
    childEpoch: { pid: number; createdAt: string };
    expectedInputDigest?: string;
    expectedProducerIdentityDigest?: string;
  }): {
    ok: boolean;
    errors: Array<{ code: string; message: string }>;
    receipt?: Record<string, unknown>;
  };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as ReceiptModule;

const completedResponse = (overrides: Record<string, unknown> = {}) => ({
  structuredContent: {
    status: 'completed',
    result: {
      componentTestStatuses: [
        {
          storyId: 'components-searchfilter-searchbox--type-and-submit',
          status: 'status-value:success',
        },
        {
          storyId:
            'components-progress-progressfilelist--cancel-invokes-callback',
          status: 'status-value:success',
        },
      ],
      a11yStatuses: [
        {
          storyId: 'components-searchfilter-searchbox--type-and-submit',
          status: 'status-value:success',
        },
        {
          storyId:
            'components-progress-progressfilelist--cancel-invokes-callback',
          status: 'status-value:success',
        },
      ],
      counts: { requested: 2, executed: 2, component: 2, a11y: 2 },
      unhandledErrors: [],
      ...overrides,
    },
  },
});

const requestedStoryIds = [
  'components-searchfilter-searchbox--type-and-submit',
  'components-progress-progressfilelist--cancel-invokes-callback',
];

const identity = {
  freezeId: 'freeze-1',
  producerId: 'producer-1',
  inputDigest: 'sha256:inputs',
  producerIdentityDigest: 'sha256:producer',
  childEpoch: { pid: 101, createdAt: '2026-10-19T00:00:01.000Z' },
};

describe('normalizeMcpReceipt', () => {
  it('normalizes exact component and a11y results without requiring optional upstream fields', () => {
    const result = moduleUnderTest.normalizeMcpReceipt({
      requestId: 7,
      requestedStoryIds,
      response: completedResponse(),
      ...identity,
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.receipt).toMatchObject({
      requestId: 7,
      requestedStoryIds,
      executedStoryIds: requestedStoryIds,
      freezeId: 'freeze-1',
      producerId: 'producer-1',
      verdict: 'passed',
    });
  });

  it.each([
    [
      'one-of-two results',
      [{ storyId: requestedStoryIds[0], status: 'status-value:success' }],
    ],
    [
      'an unknown story ID',
      [
        ...requestedStoryIds.map((storyId) => ({
          storyId,
          status: 'status-value:success',
        })),
        { storyId: 'unknown', status: 'status-value:success' },
      ],
    ],
  ])('rejects %s in component results', (_name, componentTestStatuses) => {
    const result = moduleUnderTest.normalizeMcpReceipt({
      requestId: 1,
      requestedStoryIds,
      response: completedResponse({ componentTestStatuses }),
      ...identity,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'EXECUTION_INCOMPLETE' }),
      ])
    );
  });

  it('rejects duplicate statuses, missing a11y, cancellation, and unhandled errors', () => {
    const duplicate = moduleUnderTest.normalizeMcpReceipt({
      requestId: 2,
      requestedStoryIds,
      response: completedResponse({
        componentTestStatuses: [
          { storyId: requestedStoryIds[0], status: 'status-value:success' },
          { storyId: requestedStoryIds[0], status: 'status-value:success' },
          { storyId: requestedStoryIds[1], status: 'status-value:success' },
        ],
      }),
      ...identity,
    });
    const missingA11y = moduleUnderTest.normalizeMcpReceipt({
      requestId: 3,
      requestedStoryIds,
      response: completedResponse({ a11yStatuses: [] }),
      ...identity,
    });
    const cancelled = moduleUnderTest.normalizeMcpReceipt({
      requestId: 4,
      requestedStoryIds,
      response: {
        ...completedResponse(),
        structuredContent: {
          ...completedResponse().structuredContent,
          status: 'cancelled',
        },
      },
      ...identity,
    });
    const unhandled = moduleUnderTest.normalizeMcpReceipt({
      requestId: 5,
      requestedStoryIds,
      response: completedResponse({ unhandledErrors: ['child failed'] }),
      ...identity,
    });

    expect(duplicate.ok).toBe(false);
    expect(missingA11y.ok).toBe(false);
    expect(cancelled.ok).toBe(false);
    expect(unhandled.ok).toBe(false);
  });

  it('rejects missing structured data, protocol errors, and non-success statuses', () => {
    const missing = moduleUnderTest.normalizeMcpReceipt({
      requestId: 6,
      requestedStoryIds,
      response: {},
      ...identity,
    });
    const protocolError = moduleUnderTest.normalizeMcpReceipt({
      requestId: 7,
      requestedStoryIds,
      response: { isError: true, error: { message: 'runner failed' } },
      ...identity,
    });
    const failedStatus = moduleUnderTest.normalizeMcpReceipt({
      requestId: 8,
      requestedStoryIds,
      response: completedResponse({
        componentTestStatuses: requestedStoryIds.map((storyId) => ({
          storyId,
          status: 'status-value:failed',
        })),
      }),
      ...identity,
    });

    expect(missing.ok).toBe(false);
    expect(protocolError.ok).toBe(false);
    expect(failedStatus.ok).toBe(false);
  });

  it('rejects a receipt whose identity digest is stale for the selected freeze', () => {
    const result = moduleUnderTest.normalizeMcpReceipt({
      requestId: 9,
      requestedStoryIds,
      response: completedResponse(),
      ...identity,
      expectedInputDigest: 'sha256:other-inputs',
      expectedProducerIdentityDigest: 'sha256:other-producer',
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'EXECUTION_INCOMPLETE' }),
      ])
    );
  });
});
