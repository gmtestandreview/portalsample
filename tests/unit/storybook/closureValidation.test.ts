import { describe, expect, it } from 'vitest';

type ClosureModule = {
  computeIndexDigest(index: Record<string, unknown>): string;
  deriveExecutableStorySet(input: {
    index: { entries: Record<string, unknown> };
    requiredStoryIds?: string[];
  }): { storyIds: string[]; skipped: string[] };
  validateClosure(input: Record<string, unknown>): {
    ok: boolean;
    errors: Array<{ code: string; message: string }>;
    counts?: Record<string, number>;
  };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as ClosureModule;

const manifest = {
  schemaVersion: 1,
  records: [
    {
      source: 'ClientApp/src/components/Field.tsx',
      export: 'Field',
      classification: 'direct',
      owner: 'Field',
      reason: 'The component is a renderable public field.',
      docsOwnerId: 'components-field',
      states: [
        {
          name: 'default',
          applicability: 'required',
          outcome: 'shows the field',
          storyFile: 'ClientApp/src/components/Field.stories.tsx',
          storyExport: 'Default',
          storyId: 'components-field--default',
          assertionFile: 'ClientApp/src/components/Field.stories.tsx',
          assertionExport: 'Default.play',
          assertionMarker: 'expect-visible-field',
          rationale: 'The default state is usable.',
        },
      ],
      review: {
        reviewer: 'storybook-remediation',
        rationale: 'The source and story were reviewed together.',
        reviewedSourceDigest: 'sha256:field',
      },
    },
  ],
};

const fullIndex = {
  entries: {
    'components-field': { id: 'components-field', type: 'docs' },
    'components-field--default': {
      id: 'components-field--default',
      type: 'story',
    },
    'components-field--skipped': {
      id: 'components-field--skipped',
      type: 'story',
      tags: ['skip-test'],
    },
  },
};

const docsIndex = fullIndex;

const receipt = {
  receiptId: 'receipt-cold',
  freezeId: 'freeze-1',
  producerId: 'producer-1',
  inputDigest: 'sha256:inputs',
  producerIdentityDigest: 'sha256:producer',
  requestedStoryIds: ['components-field--default'],
  executedStoryIds: ['components-field--default'],
  componentTestStatuses: [
    {
      storyId: 'components-field--default',
      status: 'status-value:success',
    },
  ],
  a11yStatuses: [
    { storyId: 'components-field--default', status: 'status-value:success' },
  ],
  childEpoch: { pid: 101, createdAt: '2026-10-19T00:00:01.000Z' },
  verdict: 'passed',
};

describe('closure evidence validation', () => {
  it('derives only executable story entries and reports skipped entries separately', () => {
    expect(
      moduleUnderTest.deriveExecutableStorySet({ index: fullIndex })
    ).toEqual({
      storyIds: ['components-field--default'],
      skipped: ['components-field--skipped'],
    });
    expect(
      moduleUnderTest.deriveExecutableStorySet({
        index: fullIndex,
        requiredStoryIds: ['components-field--required'],
      })
    ).toEqual({
      storyIds: ['components-field--default', 'components-field--required'],
      skipped: ['components-field--skipped'],
    });
  });

  it('accepts current full/docs indexes and exact passing receipts', () => {
    expect(
      moduleUnderTest.validateClosure({
        manifest,
        fullIndex,
        docsIndex,
        receipts: [receipt],
        freeze: {
          freezeId: 'freeze-1',
          inputDigest: 'sha256:inputs',
          fullIndexDigest: moduleUnderTest.computeIndexDigest(fullIndex),
          docsIndexDigest: moduleUnderTest.computeIndexDigest(docsIndex),
        },
        producer: {
          producerId: 'producer-1',
          producerIdentityDigest: 'sha256:producer',
        },
      })
    ).toEqual({
      ok: true,
      errors: [],
      counts: { required: 1, executed: 1, skipped: 1 },
    });
  });

  it('rejects a receipt that omits a required execution or a11y result', () => {
    const invalidReceipt = {
      ...receipt,
      a11yStatuses: [],
      executedStoryIds: [],
    };
    const result = moduleUnderTest.validateClosure({
      manifest,
      fullIndex,
      docsIndex,
      receipts: [invalidReceipt],
      freeze: {
        freezeId: 'freeze-1',
        inputDigest: 'sha256:inputs',
        fullIndexDigest: moduleUnderTest.computeIndexDigest(fullIndex),
        docsIndexDigest: moduleUnderTest.computeIndexDigest(docsIndex),
      },
      producer: {
        producerId: 'producer-1',
        producerIdentityDigest: 'sha256:producer',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.map(({ code }) => code)).toContain(
      'EXECUTION_INCOMPLETE'
    );
  });

  it('rejects duplicate or failed status entries even when a passing duplicate is present', () => {
    const invalidReceipt = {
      ...receipt,
      componentTestStatuses: [
        ...receipt.componentTestStatuses,
        {
          storyId: 'components-field--default',
          status: 'status-value:failed',
        },
      ],
    };
    const result = moduleUnderTest.validateClosure({
      manifest,
      fullIndex,
      docsIndex,
      receipts: [invalidReceipt],
      freeze: {
        freezeId: 'freeze-1',
        inputDigest: 'sha256:inputs',
        fullIndexDigest: moduleUnderTest.computeIndexDigest(fullIndex),
        docsIndexDigest: moduleUnderTest.computeIndexDigest(docsIndex),
      },
      producer: {
        producerId: 'producer-1',
        producerIdentityDigest: 'sha256:producer',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.map(({ code }) => code)).toContain(
      'EXECUTION_INCOMPLETE'
    );
  });
});
