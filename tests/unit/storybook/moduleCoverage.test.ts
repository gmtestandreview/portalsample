import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

type CoverageState = {
  name: string;
  applicability: 'required' | 'not-supported';
  outcome: string;
  storyFile: string | null;
  storyExport: string | null;
  storyId: string | null;
  assertionFile: string | null;
  assertionExport: string | null;
  assertionMarker: string | null;
  rationale: string;
};

type SourceExport = {
  source: string;
  export: string;
  kind: 'renderable' | 'nonvisual';
};

type UnresolvedExport = {
  source: string;
  export: string;
  code: string;
  reason: string;
};

type Discovery = {
  exports: SourceExport[];
  unresolved: UnresolvedExport[];
};

type ValidationResult = {
  ok: boolean;
  errors: Array<{ code: string; message?: string; path?: string }>;
};

type CoverageModule = {
  discoverSourceExports(input: {
    files: Array<{ path: string; content: string }>;
  }): Discovery;
  main(argv?: string[]): {
    exitCode: number;
    errors: ValidationResult['errors'];
  };
  validateManifest(manifest: unknown): ValidationResult;
  parseJsonDocument(text: string): unknown;
  validateSourceClaims(
    manifest: unknown,
    discovery: Discovery,
  ): ValidationResult;
  generateInventory(input: { manifest: unknown }): {
    ok: boolean;
    errors: ValidationResult['errors'];
    regions?: {
      components: string;
      routes: string;
      matrix: string;
    };
  };
};

// The maintained CLI is JavaScript; this local contract keeps the test typed
// without adding a declaration file outside the approved T2a write set.
const untypedCoverageModule =
  // @ts-expect-error TS7016: the test supplies the maintained .mjs contract above
  await import('../../../scripts/storybook-coverage.mjs');

const coverageModule = untypedCoverageModule as unknown as CoverageModule;

const {
  discoverSourceExports,
  generateInventory,
  main,
  validateManifest,
  validateSourceClaims,
} = coverageModule;

const validState: CoverageState = {
  name: 'default',
  applicability: 'required',
  outcome: 'shows the field label and accepts text',
  storyFile: 'ClientApp/src/components/Field.stories.tsx',
  storyExport: 'Default',
  storyId: 'components-field--default',
  assertionFile: 'ClientApp/src/components/Field.stories.tsx',
  assertionExport: 'Default.play',
  assertionMarker: 'expect-visible-label',
  rationale: 'The default state proves the component is rendered and usable.',
};

const validRecord = {
  source: 'ClientApp/src/components/Field.tsx',
  export: 'Field',
  classification: 'direct',
  owner: 'Field',
  reason: 'The component is a renderable public field.',
  docsOwnerId: 'components-field',
  states: [validState],
  review: {
    reviewer: 'storybook-remediation',
    rationale: 'The source export and asserted story are reviewed together.',
    reviewedSourceDigest: 'sha256:field-source',
  },
};

const validManifest = {
  schemaVersion: 1,
  records: [validRecord],
};

const sourceModeFixtureDirectory = join(
  process.cwd(),
  'tests/fixtures/storybook/module-coverage',
);

const sourceModeManifestPath = join(
  sourceModeFixtureDirectory,
  'coverageManifest.json',
);

describe('storybook coverage manifest schema v1', () => {
  it('accepts a reviewed renderable record with a meaningful required state', () => {
    expect.assertions(1);
    expect(validateManifest(validManifest)).toEqual({
      ok: true,
      errors: [],
    });
  });
});

describe('storybook coverage manifest schema v1', () => {
  it('rejects a non-v1 schema and unknown record fields', () => {
    expect.assertions(2);
    expect(
      validateManifest({
        ...validManifest,
        schemaVersion: 2,
      }),
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });

    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, unexpected: true }],
      }),
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });
  });
});

describe('storybook coverage manifest schema v1', () => {
  it.each([
    '',
    '/absolute/path.tsx',
    'C:/absolute/path.tsx',
    'nested/../path.tsx',
  ])('rejects a non-relative source path: %s', (source) => {
    expect.assertions(1);
    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, source }],
      }),
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });
  });
});
