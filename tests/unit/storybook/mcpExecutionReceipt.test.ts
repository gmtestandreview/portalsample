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
    expect.assertions(2);
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
});

describe('normalizeMcpReceipt', () => {
  it('normalizes a complete markdown report returned by the native MCP endpoint', () => {
    expect.assertions(2);
    const result = moduleUnderTest.normalizeMcpReceipt({
      requestId: 10,
      requestedStoryIds,
      response: {
        content: [
          {
            type: 'text',
            text: `## Passing Stories\n\n- ${requestedStoryIds[0]}\n- ${requestedStoryIds[1]}`,
          },
        ],
      },
      ...identity,
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.receipt).toMatchObject({
      requestedStoryIds,
      executedStoryIds: requestedStoryIds,
      verdict: 'passed',
      report: {
        passingStoryIds: requestedStoryIds,
        failingStoryIds: [],
        accessibilityViolationStoryIds: [],
        unhandledErrors: [],
      },
    });
  });
});
