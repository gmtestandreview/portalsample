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
    discovery: Discovery
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
  'tests/fixtures/storybook/module-coverage'
);
const sourceModeManifestPath = join(
  sourceModeFixtureDirectory,
  'coverageManifest.json'
);

describe('storybook coverage manifest schema v1', () => {
  it('accepts a reviewed renderable record with a meaningful required state', () => {
    expect(validateManifest(validManifest)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it('rejects a non-v1 schema and unknown record fields', () => {
    expect(
      validateManifest({
        ...validManifest,
        schemaVersion: 2,
      })
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });

    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, unexpected: true }],
      })
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });
  });

  it.each([
    '',
    '/absolute/path.tsx',
    'C:/absolute/path.tsx',
    'nested/../path.tsx',
  ])('rejects a non-relative source path: %s', (source) => {
    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, source }],
      })
    ).toMatchObject({
      ok: false,
      errors: [{ code: 'MANIFEST_SCHEMA_INVALID' }],
    });
  });
});

describe('recursive canonical source/export discovery', () => {
  it('finds nested declarations and canonicalises a pure re-export', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/forms/nested/Field.tsx',
          content: 'export const Field = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/forms/index.ts',
          content: "export { Field } from './nested/Field';\n",
        },
      ],
    });

    expect(result.unresolved).toEqual([]);
    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/forms/nested/Field.tsx',
      export: 'Field',
      kind: 'renderable',
    });
    expect(
      result.exports.filter((entry) => entry.export === 'Field')
    ).toHaveLength(1);
  });

  it('records ambiguous extension resolution instead of guessing', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/Thing.ts',
          content: 'export const Thing = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/Thing.tsx',
          content: 'export const Thing = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/index.ts',
          content: "export { Thing } from './Thing';\n",
        },
      ],
    });

    expect(result.unresolved).toContainEqual({
      source: 'ClientApp/src/components/index.ts',
      export: 'Thing',
      code: 'SOURCE_UNRESOLVED',
      reason: 'ambiguous module resolution',
    });
  });

  it('records only the public default export for a named default declaration', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/DefaultField.tsx',
          content: 'export default function DefaultField() { return null; }\n',
        },
      ],
    });

    expect(result.exports).toEqual([
      {
        source: 'ClientApp/src/components/DefaultField.tsx',
        export: 'default',
        kind: 'renderable',
      },
    ]);
  });

  it('preserves aliases and resolves extensionless .mts and .cts re-exports', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/Typed.mts',
          content: 'export const Typed = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/Legacy.cts',
          content: 'export const Legacy = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/index.ts',
          content:
            "export { Typed as Renamed } from './Typed';\nexport { Legacy } from './Legacy';\n",
        },
      ],
    });

    expect(result.unresolved).toEqual([]);
    expect(result.exports).toEqual(
      expect.arrayContaining([
        {
          source: 'ClientApp/src/components/Typed.mts',
          export: 'Renamed',
          kind: 'renderable',
        },
        {
          source: 'ClientApp/src/components/Legacy.cts',
          export: 'Legacy',
          kind: 'renderable',
        },
      ])
    );
  });

  it('does not treat an import-only module as a canonical export', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/Consumer.tsx',
          content:
            "import { Field } from './Field';\nexport const Consumer = () => Field;\n",
        },
      ],
    });

    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/Consumer.tsx',
      export: 'Consumer',
      kind: 'renderable',
    });
    expect(result.exports).not.toContainEqual(
      expect.objectContaining({ export: 'Field' })
    );
  });

  it('canonicalises local imported re-exports and ignores package re-exports', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/Content.tsx',
          content: 'export const Text = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/ReExports.tsx',
          content:
            "import { Text } from './Content';\nexport { Text };\nexport { Heading } from 'react-aria-components';\n",
        },
      ],
    });

    expect(result.unresolved).toEqual([]);
    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/Content.tsx',
      export: 'Text',
      kind: 'renderable',
    });
    expect(result.exports).not.toContainEqual(
      expect.objectContaining({ export: 'Heading' })
    );
    expect(
      result.exports.filter((entry) => entry.export === 'Text')
    ).toHaveLength(1);
  });

  it('limits discovery to component and route source trees', () => {
    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/Field.tsx',
          content: 'export const Field = () => null;\n',
        },
        {
          path: 'ClientApp/src/validationSchemas/contactValidation.ts',
          content: 'export const emailSchema = {};\n',
        },
      ],
    });

    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/Field.tsx',
      export: 'Field',
      kind: 'renderable',
    });
    expect(result.exports).not.toContainEqual(
      expect.objectContaining({ export: 'emailSchema' })
    );
  });
});

describe('renderable evidence and claim validation', () => {
  it.each(['direct', 'consumer', 'forwarding'])(
    'accepts a meaningful required baseline for %s claims',
    (classification) => {
      expect(
        validateManifest({
          ...validManifest,
          records: [{ ...validRecord, classification }],
        })
      ).toEqual({ ok: true, errors: [] });
    }
  );

  it('rejects an empty source inventory', () => {
    expect(
      validateSourceClaims(
        { schemaVersion: 1, records: [] },
        { exports: [], unresolved: [] }
      )
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: 'EVIDENCE_MISSING' })],
    });
  });

  it.each([
    ['empty states', []],
    [
      'all-not-supported states',
      [
        {
          ...validState,
          applicability: 'not-supported',
          outcome: 'No disabled state is supported by this API.',
          storyFile: null,
          storyExport: null,
          storyId: null,
          assertionFile: null,
          assertionExport: null,
          assertionMarker: null,
          rationale: 'The API has no disabled state contract.',
        },
      ],
    ],
    [
      'smoke-only baseline',
      [
        {
          ...validState,
          outcome: 'renders without throwing',
          assertionMarker: 'rendered',
        },
      ],
    ],
  ])('rejects %s', (_label, states) => {
    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, states }],
      })
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'EVIDENCE_MISSING' }),
      ]),
    });
  });

  it('rejects duplicate canonical claims', () => {
    expect(
      validateSourceClaims(
        { ...validManifest, records: [validRecord, validRecord] },
        {
          exports: [
            {
              source: validRecord.source,
              export: validRecord.export,
              kind: 'renderable',
            },
          ],
          unresolved: [],
        }
      )
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'CLAIM_DUPLICATE' }),
      ]),
    });
  });

  it('rejects discovered exports that have no manifest claim', () => {
    const result = validateSourceClaims(validManifest, {
      exports: [
        {
          source: validRecord.source,
          export: validRecord.export,
          kind: 'renderable',
        },
        {
          source: 'ClientApp/src/components/Unclaimed.tsx',
          export: 'Unclaimed',
          kind: 'renderable',
        },
      ],
      unresolved: [],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: 'EVIDENCE_MISSING',
        path: 'ClientApp/src/components/Unclaimed.tsx',
      })
    );
  });

  it('rejects unresolved source/export claims', () => {
    expect(
      validateSourceClaims(validManifest, {
        exports: [],
        unresolved: [
          {
            source: validRecord.source,
            export: validRecord.export,
            code: 'SOURCE_UNRESOLVED',
            reason: 'ambiguous module resolution',
          },
        ],
      })
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'SOURCE_UNRESOLVED' }),
      ]),
    });
  });

  it('rejects a claim supported only by an import edge', () => {
    expect(
      validateSourceClaims(
        {
          ...validManifest,
          records: [
            {
              ...validRecord,
              source: 'ClientApp/src/components/Consumer.tsx',
              export: 'Field',
            },
          ],
        },
        {
          exports: [
            {
              source: 'ClientApp/src/components/Consumer.tsx',
              export: 'Consumer',
              kind: 'renderable',
            },
          ],
          unresolved: [],
        }
      )
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'SOURCE_UNRESOLVED' }),
      ]),
    });
  });
});

describe('guarded Storybook coverage CLI', () => {
  it('rejects duplicate JSON keys before parsing the document', () => {
    expect(() =>
      coverageModule.parseJsonDocument('{"records": [], "records": []}')
    ).toThrow(/duplicate manifest JSON key: records/u);
  });

  it('does not execute on module import and rejects invalid invocation stably', async () => {
    expect(process.exitCode).toBeUndefined();
    expect(main(['--mode', 'unknown'])).toMatchObject({
      exitCode: 2,
      errors: [{ code: 'INVALID_INVOCATION' }],
    });
  });

  it('runs source mode from explicit inputs without importing application modules', async () => {
    expect(
      main([
        '--mode',
        'source',
        '--manifest',
        sourceModeManifestPath,
        '--source-root',
        sourceModeFixtureDirectory,
      ])
    ).toMatchObject({ exitCode: 0, errors: [] });
  });
});

describe('deterministic inventory generation', () => {
  it('renders sorted source rows and a count summary without runtime metadata', () => {
    const result = generateInventory({
      manifest: {
        ...validManifest,
        records: [
          validRecord,
          {
            ...validRecord,
            source: 'ClientApp/src/components/Zed.tsx',
            export: 'Zed',
            owner: 'Zed component',
            docsOwnerId: 'components-zed',
          },
          {
            ...validRecord,
            source: 'ClientApp/src/routes/Example.tsx',
            export: 'ExampleRoute',
            owner: 'Example route',
            docsOwnerId: 'routes-example',
            states: [
              {
                ...validState,
                storyFile: 'ClientApp/src/routes/Example.stories.tsx',
                storyExport: 'Default',
                storyId: 'routes-example--default',
                assertionFile: 'ClientApp/src/routes/Example.stories.tsx',
                assertionExport: 'Default.play',
              },
            ],
          },
        ],
      },
    });

    expect(result).toMatchObject({ ok: true, errors: [] });
    expect(result.regions?.components).toContain(
      'ClientApp/src/components/Field.tsx#Field'
    );
    expect(result.regions?.routes).toContain(
      'ClientApp/src/routes/Example.tsx#ExampleRoute'
    );
    expect(result.regions?.matrix).toContain('Renderable records: 3');
    expect(result.regions?.matrix).not.toMatch(
      /generatedAt|receiptId|timestamp/u
    );

    const componentRegion = result.regions?.components ?? '';

    expect(componentRegion.indexOf('Field.tsx#Field')).toBeLessThan(
      componentRegion.indexOf('Zed.tsx#Zed')
    );
  });

  it('refuses to generate regions from an invalid manifest', () => {
    expect(
      generateInventory({ manifest: { schemaVersion: 2, records: [] } })
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: 'MANIFEST_SCHEMA_INVALID' })],
    });
  });
});
