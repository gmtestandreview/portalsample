import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

type EvidenceResult = {
  ok: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
};

type EvidenceModule = {
  validateStoryEvidence(input: {
    manifest: unknown;
    files: Array<{ path: string; content: string | Uint8Array }>;
    index: unknown;
  }): EvidenceResult;
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as EvidenceModule;

const sourcePath = 'ClientApp/src/components/Field.tsx';
const storyPath = 'ClientApp/src/components/Field.stories.tsx';
const sourceContent = 'export const Field = () => null;\n';
const storyContent = [
  'export const Default = {',
  '  play: async () => {',
  "    expect('expect-visible-label').toBe('expect-visible-label');",
  '  },',
  '};',
  '',
].join('\n');
const sourceDigest = `sha256:${createHash('sha256')
  .update(Buffer.from(sourceContent, 'utf8'))
  .digest('hex')}`;

const files = [
  { path: sourcePath, content: sourceContent },
  { path: storyPath, content: storyContent },
];

const manifest = {
  schemaVersion: 1,
  records: [
    {
      source: sourcePath,
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
          storyFile: storyPath,
          storyExport: 'Default',
          storyId: 'components-field--default',
          assertionFile: storyPath,
          assertionExport: 'Default.play',
          assertionMarker: 'expect-visible-label',
          rationale: 'The default state proves the component is usable.',
        },
      ],
      review: {
        reviewer: 'storybook-remediation',
        rationale:
          'The source export and asserted story are reviewed together.',
        reviewedSourceDigest: sourceDigest,
      },
    },
  ],
};

const manifestRecord = manifest.records[0]!;
const manifestState = manifestRecord.states[0]!;

const index = {
  entries: {
    docs: { id: 'components-field', type: 'docs' },
    story: { id: 'components-field--default', type: 'story' },
  },
};

describe('reviewed Storybook source and story evidence', () => {
  it('accepts a declaration, story play function, marker, index ID, and exact digest', () => {
    expect.hasAssertions();

    expect(
      moduleUnderTest.validateStoryEvidence({ manifest, files, index }),
    ).toStrictEqual({ ok: true, errors: [] });
  });

  describe('markers nested in assertion arguments', () => {
    const withPlayBody = (body: string) => [
      { path: sourcePath, content: sourceContent },
      {
        path: storyPath,
        content: `export const Default = { play: async () => { ${body} } };\n`,
      },
    ];

    it('accepts a marker inside a locator passed to expect', () => {
      expect.hasAssertions();

      const files = withPlayBody(
        "await expect(canvas.getByText('expect-visible-label')).toBeVisible();",
      );

      expect(
        moduleUnderTest.validateStoryEvidence({ manifest, files, index }),
      ).toStrictEqual({ ok: true, errors: [] });
    });

    it.each([
      [
        'a matcher argument',
        "await expect(canvas.getByRole('link')).toHaveAttribute('expect-visible-label', '/a');",
      ],
      [
        'a negated matcher argument',
        "await expect(canvas.getByRole('link')).not.toHaveTextContent('expect-visible-label');",
      ],
    ])('accepts a marker passed as %s', (_name, body) => {
      expect.hasAssertions();

      expect(
        moduleUnderTest.validateStoryEvidence({
          manifest,
          files: withPlayBody(body),
          index,
        }),
      ).toStrictEqual({ ok: true, errors: [] });
    });

    it('rejects a marker passed to a call that is not an assertion chain', () => {
      expect.hasAssertions();

      const result = moduleUnderTest.validateStoryEvidence({
        manifest,
        files: withPlayBody(
          "await userEvent.type(field, 'expect-visible-label'); expect(true).toBe(true);",
        ),
        index,
      });

      expect(result.errors.map((entry) => entry.code)).toContain(
        'EVIDENCE_MISSING',
      );
    });

    it('rejects a marker used only in a locator outside any assertion', () => {
      expect.hasAssertions();

      const files = withPlayBody(
        "await canvas.getByText('expect-visible-label').click(); expect(true).toBe(true);",
      );
      const result = moduleUnderTest.validateStoryEvidence({
        manifest,
        files,
        index,
      });

      expect(result.errors.map((entry) => entry.code)).toContain(
        'EVIDENCE_MISSING',
      );
    });
  });

  describe('stories declared with the CSF Factories meta.story call', () => {
    const factoryStory = (body: string) =>
      [
        'const meta = preview.meta({});',
        `export const Default = meta.story({${body}});`,
        '',
      ].join('\n');
    const factoryFiles = (content: string) => [
      { path: sourcePath, content: sourceContent },
      { path: storyPath, content },
    ];

    it('accepts a play function with the reviewed assertion marker', () => {
      expect.hasAssertions();

      const content = factoryStory(
        "play: async () => { expect('expect-visible-label').toBeTruthy(); }",
      );

      expect(
        moduleUnderTest.validateStoryEvidence({
          manifest,
          files: factoryFiles(content),
          index,
        }),
      ).toStrictEqual({ ok: true, errors: [] });
    });

    it.each([
      ['no play property', 'render: () => null'],
      [
        'a play function without the marker',
        "play: async () => { expect('different-marker').toBeTruthy(); }",
      ],
    ])('rejects %s', (_name, body) => {
      expect.hasAssertions();

      const result = moduleUnderTest.validateStoryEvidence({
        manifest,
        files: factoryFiles(factoryStory(body)),
        index,
      });

      expect(result.ok).toBe(false);
      expect(result.errors.map((entry) => entry.code)).toContain(
        'EVIDENCE_MISSING',
      );
    });
  });

  it.each([
    [
      'missing source file',
      files.filter((file) => file.path !== sourcePath),
      'SOURCE_UNRESOLVED',
    ],
    [
      'missing story file',
      files.filter((file) => file.path !== storyPath),
      'EVIDENCE_MISSING',
    ],
    [
      'missing named story export',
      [
        { path: sourcePath, content: sourceContent },
        { path: storyPath, content: storyContent.replace('Default', 'Other') },
      ],
      'EVIDENCE_MISSING',
    ],
    [
      'missing play export',
      [
        { path: sourcePath, content: sourceContent },
        { path: storyPath, content: storyContent.replace('play:', 'render:') },
      ],
      'EVIDENCE_MISSING',
    ],
    [
      'missing assertion marker',
      [
        { path: sourcePath, content: sourceContent },
        {
          path: storyPath,
          content: storyContent.replaceAll(
            'expect-visible-label',
            'different-marker',
          ),
        },
      ],
      'EVIDENCE_MISSING',
    ],
    ['stale source digest', files, 'EVIDENCE_MISSING'],
  ])('rejects %s', (_label, evidenceFiles, code) => {
    expect.hasAssertions();

    const changedManifest =
      _label === 'stale source digest'
        ? {
            ...manifest,
            records: [
              {
                ...manifestRecord,
                review: {
                  ...manifestRecord.review,
                  reviewedSourceDigest: 'sha256:stale',
                },
              },
            ],
          }
        : manifest;

    expect(
      moduleUnderTest.validateStoryEvidence({
        manifest: changedManifest,
        files: evidenceFiles,
        index,
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining<unknown>([
        expect.objectContaining({ code }),
      ]) as unknown,
    });
  });

  it('rejects assertion convention, file identity, and missing story IDs', () => {
    expect.hasAssertions();

    const invalidAssertion = {
      ...manifest,
      records: [
        {
          ...manifestRecord,
          states: [
            {
              ...manifestState,
              assertionExport: 'Other.play',
              assertionFile: 'ClientApp/src/components/Other.stories.tsx',
            },
          ],
        },
      ],
    };

    expect(
      moduleUnderTest.validateStoryEvidence({
        manifest: invalidAssertion,
        files,
        index,
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining<unknown>([
        expect.objectContaining({ code: 'EVIDENCE_MISSING' }),
      ]) as unknown,
    });

    expect(
      moduleUnderTest.validateStoryEvidence({
        manifest,
        files,
        index: { entries: { docs: index.entries.docs } },
      }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: 'REFERENCE_MISSING' })],
    });

    const typedPlayWithoutAssertion = [
      'export const Default = {',
      "  play: async (_context: { state: 'play' }) => {",
      '    await Promise.resolve();',
      '  },',
      '};',
      '',
    ].join('\n');
    const falsePositiveManifest = {
      ...manifest,
      records: [
        {
          ...manifestRecord,
          states: [{ ...manifestState, assertionMarker: 'play' }],
        },
      ],
    };

    expect(
      moduleUnderTest.validateStoryEvidence({
        manifest: falsePositiveManifest,
        files: [
          { path: sourcePath, content: sourceContent },
          { path: storyPath, content: typedPlayWithoutAssertion },
        ],
        index,
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining<unknown>([
        expect.objectContaining({ code: 'EVIDENCE_MISSING' }),
      ]) as unknown,
    });

    const nonAssertionMarker = storyContent.replace(
      "    expect('expect-visible-label').toBe('expect-visible-label');",
      "    console.log('expect-visible-label');",
    );

    expect(
      moduleUnderTest.validateStoryEvidence({
        manifest,
        files: [
          { path: sourcePath, content: sourceContent },
          { path: storyPath, content: nonAssertionMarker },
        ],
        index,
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining<unknown>([
        expect.objectContaining({ code: 'EVIDENCE_MISSING' }),
      ]) as unknown,
    });
  });
});
