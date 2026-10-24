import { describe, expect, it } from 'vitest';

type FreezeModule = {
  validateFreezeRecord(input: {
    freeze: Record<string, unknown>;
    expectedInputDigest: string;
    selectedPaths: string[];
  }): { ok: boolean; errors: Array<{ code: string; message: string }> };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as FreezeModule;

const freeze = {
  freezeId: 'freeze-1',
  inputDigest: 'sha256:inputs',
  protectedPaths: ['ClientApp/src', '.storybook'],
  denialProbes: [
    { operation: 'overwrite', denied: true },
    { operation: 'append', denied: true },
    { operation: 'create', denied: true },
    { operation: 'delete', denied: true },
    { operation: 'rename', denied: true },
  ],
  restored: false,
};

describe('validateFreezeRecord', () => {
  it('accepts a complete freeze joined to the selected input digest', () => {
    expect(
      moduleUnderTest.validateFreezeRecord({
        freeze,
        expectedInputDigest: 'sha256:inputs',
        selectedPaths: ['ClientApp/src', '.storybook'],
      })
    ).toEqual({ ok: true, errors: [] });
  });

  type Overrides = {
    freeze?: Record<string, unknown>;
    expectedInputDigest?: string;
    selectedPaths?: string[];
  };

  it.each<[string, Overrides]>([
    ['stale input digest', { expectedInputDigest: 'sha256:other' }],
    [
      'missing denial probe',
      { freeze: { ...freeze, denialProbes: freeze.denialProbes.slice(1) } },
    ],
    ['unrestored ACL state', { freeze: { ...freeze, restored: true } }],
    [
      'unprotected selected path',
      { selectedPaths: ['ClientApp/src', '.storybook', 'scripts'] },
    ],
    [
      'duplicate protected path',
      {
        freeze: {
          ...freeze,
          protectedPaths: ['ClientApp/src', 'ClientApp/src'],
        },
      },
    ],
  ])('rejects %s', (_name, overrides) => {
    expect(
      moduleUnderTest.validateFreezeRecord({
        freeze: overrides.freeze ?? freeze,
        expectedInputDigest: overrides.expectedInputDigest ?? 'sha256:inputs',
        selectedPaths: overrides.selectedPaths ?? [
          'ClientApp/src',
          '.storybook',
        ],
      })
    ).toMatchObject({ ok: false, errors: expect.any(Array) });
  });
});
