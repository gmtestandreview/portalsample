import { describe, expect, it } from 'vitest';

type ClosureModule = {
  computeIndexDigest(index: unknown): string;
  validateClosure(input: {
    manifest: unknown;
    fullIndex: unknown;
    docsIndex: unknown;
    receipts: unknown[];
    freeze: unknown;
    producer: unknown;
  }): { ok: boolean; errors: Array<{ code: string; message: string }> };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as ClosureModule;

const storyId = 'components-field--default';
const fullIndex = {
  entries: {
    docs: { id: 'components-field', type: 'docs' },
    story: { id: storyId, type: 'story' },
  },
};
const docsIndex = fullIndex;
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
          outcome: 'shows the field label and accepts text',
          storyFile: 'ClientApp/src/components/Field.stories.tsx',
          storyExport: 'Default',
          storyId,
          assertionFile: 'ClientApp/src/components/Field.stories.tsx',
          assertionExport: 'Default.play',
          assertionMarker: 'expect-visible-label',
          rationale: 'The default state proves the component is usable.',
        },
      ],
      review: {
        reviewer: 'storybook-remediation',
        rationale:
          'The source export and asserted story are reviewed together.',
        reviewedSourceDigest: 'sha256:field-source',
      },
    },
  ],
};
const freeze = {
  freezeId: 'freeze-1',
  inputDigest: 'sha256:inputs',
  fullIndexDigest: moduleUnderTest.computeIndexDigest(fullIndex),
  docsIndexDigest: moduleUnderTest.computeIndexDigest(docsIndex),
};
const producer = {
  producerId: 'producer-1',
  producerIdentityDigest: 'sha256:producer',
};
const receipt = {
  verdict: 'passed',
  freezeId: freeze.freezeId,
  producerId: producer.producerId,
  inputDigest: freeze.inputDigest,
  producerIdentityDigest: producer.producerIdentityDigest,
  requestedStoryIds: [storyId],
  executedStoryIds: [storyId],
  componentTestStatuses: [{ storyId, status: 'status-value:success' }],
  a11yStatuses: [{ storyId, status: 'status-value:success' }],
};

describe('manifest receipt closure', () => {
  it('requires every manifest story ID to have exact passing component and a11y evidence', () => {
    expect(
      moduleUnderTest.validateClosure({
        manifest,
        fullIndex,
        docsIndex,
        receipts: [receipt],
        freeze,
        producer,
      })
    ).toMatchObject({ ok: true, errors: [] });
  });

  it('rejects a closure receipt that omits the manifest story ID', () => {
    expect(
      moduleUnderTest.validateClosure({
        manifest,
        fullIndex,
        docsIndex,
        receipts: [{ ...receipt, requestedStoryIds: [], executedStoryIds: [] }],
        freeze,
        producer,
      })
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'EXECUTION_INCOMPLETE' }),
      ]),
    });
  });
});
