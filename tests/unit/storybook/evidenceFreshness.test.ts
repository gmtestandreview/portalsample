import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

type FreshnessModule = {
  computeInputDigest(input: {
    files: Array<{ path: string; content: string | Uint8Array }>;
    manifestPath?: string;
  }): string;
  validateReferences(
    manifest: unknown,
    index: unknown
  ): { ok: boolean; errors: Array<{ code: string; message: string }> };
};

const moduleUnderTest =
  // @ts-expect-error The maintained validator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage.mjs')) as FreshnessModule;

const files = [
  { path: 'ClientApp/src/App.tsx', content: 'export const App = 1;\n' },
  {
    path: 'ClientApp/src/storybook/coverageManifest.json',
    content: JSON.stringify({
      schemaVersion: 1,
      records: [
        {
          source: 'ClientApp/src/App.tsx',
          export: 'App',
          review: { reviewer: 'test', reviewedSourceDigest: 'sha256:old' },
        },
      ],
    }),
  },
];

const referenceManifest = {
  schemaVersion: 1,
  records: [
    {
      source: 'ClientApp/src/App.tsx',
      export: 'App',
      classification: 'direct',
      owner: 'App',
      reason: 'The application shell is directly rendered.',
      docsOwnerId: 'components-app--docs',
      states: [
        {
          name: 'default',
          applicability: 'required',
          outcome: 'shows the application shell and navigation',
          storyFile: 'ClientApp/src/App.stories.tsx',
          storyExport: 'Default',
          storyId: 'components-app--default',
          assertionFile: 'ClientApp/src/App.stories.tsx',
          assertionExport: 'Default.play',
          assertionMarker: 'shell-visible',
          rationale: 'The shell story demonstrates the required baseline.',
        },
      ],
      review: {
        reviewer: 'test',
        rationale: 'The application shell is reviewed with its story.',
        reviewedSourceDigest: 'sha256:app',
      },
    },
  ],
};

describe('computeInputDigest', () => {
  it('keeps digest ordering independent of the process locale', () => {
    const originalLocaleCompare = String.prototype.localeCompare;
    String.prototype.localeCompare = function localeCompare(
      this: string,
      other: string
    ) {
      return this < other ? 1 : this > other ? -1 : 0;
    };

    try {
      const reversedLocaleDigest = moduleUnderTest.computeInputDigest({
        files,
      });

      String.prototype.localeCompare = originalLocaleCompare;

      expect(reversedLocaleDigest).toBe(
        moduleUnderTest.computeInputDigest({ files })
      );
    } finally {
      String.prototype.localeCompare = originalLocaleCompare;
    }
  });

  it('canonicalizes manifest object-key order and ignores reviewedSourceDigest refreshes', () => {
    const [appFile, manifestFile] = files;
    if (appFile === undefined || manifestFile === undefined) {
      throw new Error('digest fixture is incomplete');
    }
    const reordered = [manifestFile, appFile].map((file) => ({
      ...file,
      content: file.path.endsWith('coverageManifest.json')
        ? JSON.stringify({
            records: [
              {
                review: {
                  reviewedSourceDigest: 'sha256:new',
                  reviewer: 'test',
                },
                export: 'App',
                source: 'ClientApp/src/App.tsx',
              },
            ],
            schemaVersion: 1,
          })
        : file.content,
    }));

    expect(moduleUnderTest.computeInputDigest({ files })).toBe(
      moduleUnderTest.computeInputDigest({ files: reordered })
    );
  });

  it('accepts byte input for the canonical coverage manifest', () => {
    const byteFiles = files.map((file) => ({
      ...file,
      content: file.path.endsWith('coverageManifest.json')
        ? Buffer.from(String(file.content))
        : file.content,
    }));

    expect(moduleUnderTest.computeInputDigest({ files: byteFiles })).toBe(
      moduleUnderTest.computeInputDigest({ files })
    );
  });

  it('requires docs and story references to resolve to generated index entries', () => {
    const index = {
      entries: {
        docs: { id: 'components-app--docs', type: 'docs' },
        story: { id: 'components-app--default', type: 'story' },
      },
    };

    expect(
      moduleUnderTest.validateReferences(referenceManifest, index)
    ).toEqual({
      ok: true,
      errors: [],
    });
    expect(
      moduleUnderTest.validateReferences(referenceManifest, {
        entries: { docs: { id: 'components-app--docs', type: 'docs' } },
      })
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: 'REFERENCE_MISSING' })],
    });
  });

  it('changes when array order or ordinary source bytes change', () => {
    const reorderedManifest = JSON.stringify({
      schemaVersion: 1,
      records: [{ export: 'Other' }, { export: 'App' }],
    });
    const reordered = files.map((file) =>
      file.path.endsWith('coverageManifest.json')
        ? { ...file, content: reorderedManifest }
        : file
    );
    const changedSource = files.map((file) =>
      file.path.endsWith('App.tsx')
        ? { path: file.path, content: 'export const App = 2;\n' }
        : file
    );

    expect(moduleUnderTest.computeInputDigest({ files: reordered })).not.toBe(
      moduleUnderTest.computeInputDigest({ files })
    );
    expect(
      moduleUnderTest.computeInputDigest({ files: changedSource })
    ).not.toBe(moduleUnderTest.computeInputDigest({ files }));
  });

  it('requires the canonical coverage manifest to be included', () => {
    expect(() =>
      moduleUnderTest.computeInputDigest({
        files: [{ path: 'ClientApp/src/App.tsx', content: 'source' }],
      })
    ).toThrow(/coverage manifest/i);
  });

  it.each([
    ['absolute paths', [{ path: '/absolute.ts', content: 'x' }]],
    ['parent segments', [{ path: 'src/../App.tsx', content: 'x' }]],
    ['empty path components', [{ path: 'src//App.tsx', content: 'x' }]],
    [
      'case-fold collisions',
      [
        { path: 'src/Button.tsx', content: 'a' },
        { path: 'src/button.tsx', content: 'b' },
      ],
    ],
  ])('rejects %s', (_name, invalidFiles) => {
    expect(() =>
      moduleUnderTest.computeInputDigest({ files: invalidFiles })
    ).toThrow();
  });
});
