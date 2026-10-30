import { readFileSync } from 'node:fs';
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
  validateForwardingEquivalence(input: {
    source: string;
    content: string;
  }): ValidationResult;
  validateStoryEvidence(input: {
    manifest: unknown;
    files: Array<{ path: string; content: string }>;
  }): ValidationResult;
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

const discoverSourceExports =
  coverageModule.discoverSourceExports.bind(coverageModule);
const generateInventory = coverageModule.generateInventory.bind(coverageModule);
const main = coverageModule.main.bind(coverageModule);
const validateManifest = coverageModule.validateManifest.bind(coverageModule);
const validateForwardingEquivalence: CoverageModule['validateForwardingEquivalence'] =
  (input) => coverageModule.validateForwardingEquivalence(input);
const validateStoryEvidence: CoverageModule['validateStoryEvidence'] = (
  input,
) => coverageModule.validateStoryEvidence(input);
const validateSourceClaims =
  coverageModule.validateSourceClaims.bind(coverageModule);

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
    expect.hasAssertions();
    expect(validateManifest(validManifest)).toStrictEqual({
      ok: true,
      errors: [],
    });
  });

  it('rejects a non-v1 schema and unknown record fields', () => {
    expect.hasAssertions();
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

  it.each([
    '',
    '/absolute/path.tsx',
    'C:/absolute/path.tsx',
    'nested/../path.tsx',
  ])('rejects a non-relative source path: %s', (source) => {
    expect.hasAssertions();
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

describe('recursive canonical source/export discovery', () => {
  it('finds nested declarations and canonicalises a pure re-export', () => {
    expect.hasAssertions();

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

    expect(result.unresolved).toStrictEqual([]);
    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/forms/nested/Field.tsx',
      export: 'Field',
      kind: 'renderable',
    });
    expect(
      result.exports.filter((entry) => entry.export === 'Field'),
    ).toHaveLength(1);
  });

  it('records ambiguous extension resolution instead of guessing', () => {
    expect.hasAssertions();

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
    expect.hasAssertions();

    const result = discoverSourceExports({
      files: [
        {
          path: 'ClientApp/src/components/DefaultField.tsx',
          content: 'export default function DefaultField() { return null; }\n',
        },
      ],
    });

    expect(result.exports).toStrictEqual([
      {
        source: 'ClientApp/src/components/DefaultField.tsx',
        export: 'default',
        kind: 'renderable',
      },
    ]);
  });

  it('preserves aliases and resolves extensionless .mts and .cts re-exports', () => {
    expect.hasAssertions();

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

    expect(result.unresolved).toStrictEqual([]);
    expect(result.exports).toStrictEqual(
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
      ]),
    );
  });

  it('does not treat an import-only module as a canonical export', () => {
    expect.hasAssertions();

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
      expect.objectContaining({ export: 'Field' }),
    );
  });

  it('canonicalises local imported re-exports and ignores package re-exports', () => {
    expect.hasAssertions();

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

    expect(result.unresolved).toStrictEqual([]);
    expect(result.exports).toContainEqual({
      source: 'ClientApp/src/components/Content.tsx',
      export: 'Text',
      kind: 'renderable',
    });
    expect(result.exports).not.toContainEqual(
      expect.objectContaining({ export: 'Heading' }),
    );
    expect(
      result.exports.filter((entry) => entry.export === 'Text'),
    ).toHaveLength(1);
  });

  it('limits discovery to component and route source trees', () => {
    expect.hasAssertions();

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
      expect.objectContaining({ export: 'emailSchema' }),
    );
  });
});

describe('renderable evidence and claim validation', () => {
  it.each(['direct', 'consumer', 'forwarding'])(
    'accepts a meaningful required baseline for %s claims',
    (classification) => {
      expect.hasAssertions();
      expect(
        validateManifest({
          ...validManifest,
          records: [{ ...validRecord, classification }],
        }),
      ).toStrictEqual({ ok: true, errors: [] });
    },
  );

  it('rejects an empty source inventory', () => {
    expect.hasAssertions();
    expect(
      validateSourceClaims(
        { schemaVersion: 1, records: [] },
        { exports: [], unresolved: [] },
      ),
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
    expect.hasAssertions();
    expect(
      validateManifest({
        ...validManifest,
        records: [{ ...validRecord, states }],
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'EVIDENCE_MISSING' }),
      ]),
    });
  });

  it('rejects duplicate canonical claims', () => {
    expect.hasAssertions();
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
        },
      ),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'CLAIM_DUPLICATE' }),
      ]),
    });
  });

  it('rejects discovered exports that have no manifest claim', () => {
    expect.hasAssertions();

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
      }),
    );
  });

  it('rejects unresolved source/export claims', () => {
    expect.hasAssertions();
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
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'SOURCE_UNRESOLVED' }),
      ]),
    });
  });

  it('rejects a claim supported only by an import edge', () => {
    expect.hasAssertions();
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
        },
      ),
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
    expect.hasAssertions();
    expect(() =>
      coverageModule.parseJsonDocument('{"records": [], "records": []}'),
    ).toThrow(/duplicate manifest JSON key: records/u);
  });

  it('does not execute on module import and rejects invalid invocation stably', async () => {
    expect.hasAssertions();
    expect(process.exitCode).toBeUndefined();
    expect(main(['--mode', 'unknown'])).toMatchObject({
      exitCode: 2,
      errors: [{ code: 'INVALID_INVOCATION' }],
    });
  });

  it('runs source mode from explicit inputs without importing application modules', async () => {
    expect.hasAssertions();
    expect(
      main([
        '--mode',
        'source',
        '--manifest',
        sourceModeManifestPath,
        '--source-root',
        sourceModeFixtureDirectory,
      ]),
    ).toMatchObject({ exitCode: 0, errors: [] });
  });
});

describe('deterministic inventory generation', () => {
  it('renders sorted source rows and a count summary without runtime metadata', () => {
    expect.hasAssertions();

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

    const componentRegion = result.regions?.components ?? '';

    expect({
      result,
      component: result.regions?.components,
      route: result.regions?.routes,
      matrix: result.regions?.matrix,
      sorted:
        componentRegion.indexOf('Field.tsx#Field') <
        componentRegion.indexOf('Zed.tsx#Zed'),
    }).toMatchObject({
      result: { ok: true, errors: [] },
      component: expect.stringContaining(
        'ClientApp/src/components/Field.tsx#Field',
      ),
      route: expect.stringContaining(
        'ClientApp/src/routes/Example.tsx#ExampleRoute',
      ),
      matrix: expect.stringContaining('Renderable records: 3'),
      sorted: true,
    });
    expect(result.regions?.matrix).not.toMatch(
      /generatedAt|receiptId|timestamp/u,
    );
  });

  it('refuses to generate regions from an invalid manifest', () => {
    expect.hasAssertions();
    expect(
      generateInventory({ manifest: { schemaVersion: 2, records: [] } }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: 'MANIFEST_SCHEMA_INVALID' })],
    });
  });
});

describe('ta/manage forwarding equivalence', () => {
  const wrapperSource = 'ClientApp/src/routes/ta/manage/index.tsx';
  const targetSource = 'ClientApp/src/routes/ta/manage/appDetails.tsx';
  const lines = (...parts: string[]) => `${parts.join('\n')}\n`;
  const importDetails = "import AppDetails from './appDetails';";
  const checkWrapper = (content: string) =>
    validateForwardingEquivalence({ source: wrapperSource, content });
  const manage = (...body: string[]) =>
    lines(importDetails, ...body, 'export default Manage;');

  it.each([
    [
      'the checked-in wrapper',
      lines(
        importDetails,
        '',
        'const TAApplicationManage = () => <AppDetails />;',
        '',
        'export default TAApplicationManage;',
      ),
    ],
    [
      'formatting-only changes',
      lines(
        'import   AppDetails   from  "./appDetails" ;',
        'const TAApplicationManage = ( ) =>',
        '  (',
        '    <AppDetails',
        '    />',
        '  ) ;',
        '// comment',
        'export default   TAApplicationManage',
      ),
    ],
    [
      'an import alias and renamed component',
      lines(
        "import Details from './appDetails';",
        'const Manage = () => <Details />;',
        'export default Manage;',
      ),
    ],
    [
      'a function declaration with a single return',
      lines(
        importDetails,
        'function Manage() {',
        '  return <AppDetails />;',
        '}',
        'export default Manage;',
      ),
    ],
    [
      'a parenthesised return',
      lines(
        importDetails,
        'function Manage() {',
        '  return (<AppDetails />);',
        '}',
        'export default Manage;',
      ),
    ],
    [
      'an as wrapper',
      manage('const Manage = () => (<AppDetails /> as unknown as null);'),
    ],
    [
      'a satisfies wrapper',
      manage('const Manage = () => <AppDetails /> satisfies unknown;'),
    ],
    [
      'an inline default export function',
      lines(
        importDetails,
        'export default function Manage() {',
        '  return <AppDetails></AppDetails>;',
        '}',
      ),
    ],
  ])('accepts %s', (_name, content) => {
    expect.hasAssertions();
    expect(checkWrapper(content)).toStrictEqual({ ok: true, errors: [] });
  });

  const importReason = /only default-import its forwarding target/u;
  const componentReason = /only declare one component exported as default/u;
  const callReason = /must not call hooks or functions/u;
  const conditionReason = /must not branch on conditions/u;
  const propsReason = /must not pass props/u;
  const signatureReason = /synchronous and take no parameters/u;
  const renderOnlyReason = /must render only <AppDetails \/>/u;
  const fragmentReason = /must not render a fragment/u;
  const childrenReason = /must not render children/u;

  it.each([
    [
      'a state hook import',
      lines(
        "import { useState } from 'react';",
        importDetails,
        'const Manage = () => {',
        '  const [open] = useState(false);',
        '  return <AppDetails />;',
        '};',
        'export default Manage;',
      ),
      importReason,
    ],
    [
      'a side-effect import',
      lines(
        "import './x';",
        importDetails,
        'const Manage = () => <AppDetails />;',
        'export default Manage;',
      ),
      importReason,
    ],
    [
      'a different target module',
      lines(
        "import AppDetails from './appDocuments';",
        'const Manage = () => <AppDetails />;',
        'export default Manage;',
      ),
      importReason,
    ],
    [
      'a named import beside the default import',
      lines(
        "import AppDetails, { extra } from './appDetails';",
        'const Manage = () => <AppDetails />;',
        'export default Manage;',
      ),
      importReason,
    ],
    [
      'a module-level side effect',
      manage("fetch('/api/ta');", 'const Manage = () => <AppDetails />;'),
      componentReason,
    ],
    [
      'a default export of a different identifier',
      lines(
        importDetails,
        'const Manage = () => <AppDetails />;',
        'const Other = () => null;',
        'export default Other;',
      ),
      componentReason,
    ],
    [
      'an extra declaration beside the component',
      manage('const extra = 1;', 'const Manage = () => <AppDetails />;'),
      componentReason,
    ],
    [
      'a state hook with no extra import',
      manage(
        'const Manage = () => {',
        '  useState(false);',
        '  return <AppDetails />;',
        '};',
      ),
      callReason,
    ],
    [
      'an effect hook with no extra import',
      manage(
        'const Manage = () => {',
        '  useEffect(() => undefined, []);',
        '  return <AppDetails />;',
        '};',
      ),
      callReason,
    ],
    [
      'a route params hook with no extra import',
      manage(
        'const Manage = () => {',
        '  useParams();',
        '  return <AppDetails />;',
        '};',
      ),
      callReason,
    ],
    [
      'an if condition',
      manage(
        'const Manage = () => {',
        '  if (globalThis.location.hash) return null;',
        '  return <AppDetails />;',
        '};',
      ),
      conditionReason,
    ],
    [
      'a ternary condition',
      manage(
        'const Manage = () => (globalThis.ready ? <AppDetails /> : null);',
      ),
      conditionReason,
    ],
    [
      'a logical-and condition',
      manage('const Manage = () => globalThis.ready && <AppDetails />;'),
      conditionReason,
    ],
    [
      'a console side effect',
      manage(
        'const Manage = () => {',
        "  console.log('manage');",
        '  return <AppDetails />;',
        '};',
      ),
      callReason,
    ],
    [
      'a fetch side effect',
      manage(
        'const Manage = () => {',
        "  fetch('/api/ta');",
        '  return <AppDetails />;',
        '};',
      ),
      callReason,
    ],
    [
      'an extra prop',
      manage('const Manage = () => <AppDetails mode="edit" />;'),
      propsReason,
    ],
    [
      'a key prop',
      manage('const Manage = () => <AppDetails key="a" />;'),
      propsReason,
    ],
    [
      'a ref prop',
      manage('const Manage = () => <AppDetails ref={null} />;'),
      propsReason,
    ],
    [
      'a spread prop',
      manage('const Manage = (props) => <AppDetails {...props} />;'),
      signatureReason,
    ],
    [
      'a wrapped child element',
      manage(
        'const Manage = () => (',
        '  <div>',
        '    <AppDetails />',
        '  </div>',
        ');',
      ),
      renderOnlyReason,
    ],
    [
      'a spread prop with no parameters',
      manage('const Manage = () => <AppDetails {...globalThis} />;'),
      propsReason,
    ],
    [
      'a child inside the forwarded element',
      manage('const Manage = () => <AppDetails>text</AppDetails>;'),
      childrenReason,
    ],
    [
      'a fragment',
      manage('const Manage = () => (<><AppDetails /></>);'),
      fragmentReason,
    ],
    [
      'an async component',
      manage('const Manage = async () => <AppDetails />;'),
      signatureReason,
    ],
    [
      'a syntax error',
      manage('const Manage = () => <AppDetails />;', 'const = ;'),
      /syntax errors/u,
    ],
  ])('rejects %s with its own reason', (_name, content, reason) => {
    expect.hasAssertions();
    expect(checkWrapper(content)).toMatchObject({
      ok: false,
      errors: [
        expect.objectContaining({
          code: 'EVIDENCE_MISSING',
          path: wrapperSource,
          message: expect.stringMatching(reason),
        }),
      ],
    });
    expect(checkWrapper(content).errors[0]?.message).toMatch(
      /consumer sufficiency/u,
    );
  });

  it('rejects a source with no declared forwarding target', () => {
    expect.hasAssertions();
    expect(
      validateForwardingEquivalence({
        source: 'ClientApp/src/routes/other/index.tsx',
        content: manage('const Manage = () => <AppDetails />;'),
      }),
    ).toMatchObject({
      ok: false,
      errors: [
        expect.objectContaining({
          message: expect.stringMatching(/no forwarding target is declared/u),
        }),
      ],
    });
  });

  it('accepts the real ta/manage wrapper and rejects a mutated copy', () => {
    expect.hasAssertions();

    const real = readFileSync(join(process.cwd(), wrapperSource), 'utf8');
    const mutated = real.replace(
      'const TAApplicationManage = () => <AppDetails />;',
      lines(
        'const TAApplicationManage = () => {',
        '  useState(0);',
        '  return <AppDetails />;',
        '};',
      ),
    );

    expect(mutated).not.toBe(real);
    expect(checkWrapper(real)).toStrictEqual({ ok: true, errors: [] });
    expect(checkWrapper(mutated).ok).toBe(false);
  });

  describe('story evidence wiring', () => {
    const forwardingErrors = (
      files: Array<{ path: string; content: string }>,
    ) =>
      validateStoryEvidence({ manifest: validManifest, files }).errors.filter(
        (entry) => /consumer sufficiency/u.test(entry.message ?? ''),
      );
    const targetFile = {
      path: targetSource,
      content: 'export default () => null;\n',
    };

    it('accepts a pure wrapper and rejects a behavioral one', () => {
      expect.hasAssertions();

      expect(
        forwardingErrors([
          targetFile,
          {
            path: wrapperSource,
            content: manage('const Manage = () => <AppDetails />;'),
          },
        ]),
      ).toHaveLength(0);
      expect(
        forwardingErrors([
          targetFile,
          {
            path: wrapperSource,
            content: manage(
              "const Manage = () => (fetch('/x'), <AppDetails />);",
            ),
          },
        ]),
      ).toHaveLength(1);
    });

    it('rejects a missing wrapper when its forwarding target is present', () => {
      expect.hasAssertions();

      expect(forwardingErrors([targetFile])).toStrictEqual([
        expect.objectContaining({
          code: 'EVIDENCE_MISSING',
          path: wrapperSource,
          message: expect.stringMatching(/wrapper source is missing/u),
        }),
      ]);
    });

    it('rejects a moved wrapper and target while other routes remain', () => {
      expect.hasAssertions();

      expect(
        forwardingErrors([
          {
            path: 'ClientApp/src/routes/ta/index.tsx',
            content: 'export default () => null;\n',
          },
        ]),
      ).toStrictEqual([
        expect.objectContaining({
          code: 'EVIDENCE_MISSING',
          path: wrapperSource,
          message: expect.stringMatching(/wrapper source is missing/u),
        }),
      ]);
    });

    it('ignores input sets that contain no route files', () => {
      expect.hasAssertions();

      expect(forwardingErrors([])).toHaveLength(0);
      expect(
        forwardingErrors([
          {
            path: 'ClientApp/src/components/Field.tsx',
            content: 'export const Field = () => null;\n',
          },
        ]),
      ).toHaveLength(0);
    });
  });
});
