import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  makeDirectorySync,
  pathExists,
  readTextFileSync,
  writeTextFileSync,
} from '../../helpers/safeTestFilesystem';

interface WorklistModule {
  buildWorklist(input: {
    files: { path: string; content: string }[];
    candidateFiles?: { path: string; reason?: string }[];
  }): {
    worklist: {
      source: string;
      export: string;
      discoveryKind: string;
      unresolvedReason: string | null;
      proposedClassification: string | null;
      owner: string;
      batch: string;
      status: string;
    }[];
    summary: {
      categoryCounts: Record<string, number>;
      diagnosticCount: number;
      discoveredExportsWithDiagnostics: number;
    };
  };
  main(argv?: string[]): {
    exitCode: number;
    errors: { code: string; message: string }[];
  };
}

const worklistModule =
  // @ts-expect-error The maintained generator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage-worklist.mjs')) as WorklistModule;

describe('storybook coverage worklist', () => {
  const createSourceRoot = () => {
    const sourceRoot = mkdtempSync(
      path.join(os.tmpdir(), 'storybook-worklist-source-'),
    );
    makeDirectorySync('ClientApp/src/components', sourceRoot);
    writeTextFileSync(
      'ClientApp/src/components/Button.tsx',
      'export const Button = () => null;\n',
      sourceRoot,
    );
    return sourceRoot;
  };

  const runGenerator = (
    sourceRoot: string,
    outputDirectory: string,
    summaryDirectory = outputDirectory,
  ) => {
    const outputPath = path.join(outputDirectory, 'worklist.json');
    const summaryPath = path.join(summaryDirectory, 'summary.json');
    const result = worklistModule.main([
      '--source-root',
      sourceRoot,
      '--out',
      outputPath,
      '--summary',
      summaryPath,
    ]);
    return { outputPath, result, summaryPath };
  };

  it('writes nested reports and overwrites an existing report intentionally', () => {
    expect.hasAssertions();

    const sourceRoot = createSourceRoot();
    const outputDirectory = path.join(sourceRoot, 'reports', 'nested');

    try {
      const firstRun = runGenerator(sourceRoot, outputDirectory);

      expect(firstRun.result.exitCode).toBe(0);

      expect(
        JSON.parse(readTextFileSync('worklist.json', outputDirectory)),
      ).toMatchObject({ schemaVersion: 1 });

      writeTextFileSync('worklist.json', '{"stale":true}\n', outputDirectory);
      const secondRun = runGenerator(sourceRoot, outputDirectory);

      expect(secondRun.result.exitCode).toBe(0);

      expect(
        JSON.parse(readTextFileSync('worklist.json', outputDirectory)),
      ).toMatchObject({ schemaVersion: 1 });
      expect(readTextFileSync('worklist.json', outputDirectory)).not.toContain(
        'stale',
      );
    } finally {
      rmSync(sourceRoot, { recursive: true, force: true });
    }
  });

  it('preserves intentionally external, sibling-prefix, and traversal destinations', () => {
    expect.hasAssertions();

    const sourceRoot = createSourceRoot();
    const externalRoot = mkdtempSync(
      path.join(os.tmpdir(), 'storybook-worklist-external-'),
    );
    const externalSummaryRoot = mkdtempSync(
      path.join(os.tmpdir(), 'storybook-worklist-external-summary-'),
    );
    const siblingPrefixRoot = path.join(
      path.dirname(sourceRoot),
      `${path.basename(sourceRoot)}-sibling`,
    );
    const traversalRoot = path.join(
      sourceRoot,
      '..',
      `${path.basename(sourceRoot)}-traversal`,
    );

    try {
      const separateExternalRun = runGenerator(
        sourceRoot,
        externalRoot,
        externalSummaryRoot,
      );

      expect(separateExternalRun.result.exitCode).toBe(0);

      expect(
        JSON.parse(readTextFileSync('worklist.json', externalRoot)),
      ).toMatchObject({ schemaVersion: 1 });
      expect(
        JSON.parse(readTextFileSync('summary.json', externalSummaryRoot)),
      ).toMatchObject({ schemaVersion: 1 });

      for (const destination of [siblingPrefixRoot, traversalRoot]) {
        const { result } = runGenerator(sourceRoot, destination);

        expect(result.exitCode).toBe(0);

        expect(
          JSON.parse(readTextFileSync('worklist.json', destination)),
        ).toMatchObject({ schemaVersion: 1 });
      }
    } finally {
      rmSync(sourceRoot, { recursive: true, force: true });
      rmSync(externalRoot, { recursive: true, force: true });
      rmSync(externalSummaryRoot, { recursive: true, force: true });
      rmSync(siblingPrefixRoot, { recursive: true, force: true });
      rmSync(traversalRoot, { recursive: true, force: true });
    }
  });

  it('rejects symlinked output ancestry, including existing nested destinations', () => {
    expect.hasAssertions();

    const sourceRoot = createSourceRoot();
    const realOutputRoot = mkdtempSync(
      path.join(os.tmpdir(), 'storybook-worklist-real-output-'),
    );
    const linkRoot = path.join(sourceRoot, 'linked-output');

    try {
      symlinkSync(
        realOutputRoot,
        linkRoot,
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      makeDirectorySync('nested', realOutputRoot);

      const { result } = runGenerator(
        sourceRoot,
        path.join(linkRoot, 'nested'),
      );

      expect(result.exitCode).toBe(1);

      expect(result.errors[0]?.message).toMatch(/symlink/i);

      expect(pathExists('nested/worklist.json', realOutputRoot)).toBe(false);
    } finally {
      rmSync(sourceRoot, { recursive: true, force: true });
      rmSync(realOutputRoot, { recursive: true, force: true });
    }
  });

  it('uses declaration-aware discovery and emits a deterministic reviewed queue', () => {
    expect.hasAssertions();

    const input = {
      files: [
        {
          path: 'ClientApp/src/components/Button.tsx',
          content: 'export const Button = () => null;\n',
        },
        {
          path: 'ClientApp/src/components/types.ts',
          content: 'export interface ButtonProps { label: string }\n',
        },
        {
          path: 'ClientApp/src/components/index.ts',
          content: "export { Button } from './Button';\n",
        },
      ],
      candidateFiles: [
        { path: 'ClientApp/src/components/Button.tsx' },
        { path: 'ClientApp/src/components/types.ts' },
        { path: 'ClientApp/src/components/index.ts' },
        {
          path: 'ClientApp/src/utils/index.ts',
          reason: 'outside inventory roots',
        },
        {
          path: 'ClientApp/src/utils/Button.tsx',
          reason: 'outside inventory roots',
        },
      ],
    };

    const first = worklistModule.buildWorklist(input);
    const second = worklistModule.buildWorklist({
      files: [...input.files].reverse(),
      candidateFiles: [...input.candidateFiles].reverse(),
    });

    expect(first).toStrictEqual(second);
    expect(first.worklist).toStrictEqual([
      {
        source: 'ClientApp/src/components/Button.tsx',
        export: 'Button',
        discoveryKind: 'renderable',
        unresolvedReason: null,
        proposedClassification: 'direct',
        owner: 'unassigned',
        batch: 'components',
        status: 'needs-review',
      },
      {
        source: 'ClientApp/src/components/types.ts',
        export: 'ButtonProps',
        discoveryKind: 'nonvisual',
        unresolvedReason: null,
        proposedClassification: 'nonvisual',
        owner: 'unassigned',
        batch: 'components',
        status: 'needs-review',
      },
    ]);
    expect(first.summary).toStrictEqual({
      categoryCounts: {
        direct: 1,
        consumer: 0,
        forwarding: 0,
        nonvisual: 1,
        unresolved: 0,
        excludedByPolicy: 2,
      },
      discoveredExports: 2,
      diagnosticCount: 3,
      discoveredExportsWithDiagnostics: 2,
      unresolvedEntries: 0,
      excludedPaths: [
        {
          path: 'ClientApp/src/utils/Button.tsx',
          reason: 'outside inventory roots',
        },
        {
          path: 'ClientApp/src/utils/index.ts',
          reason: 'outside inventory roots',
        },
      ],
    });
  });

  it('keeps unresolved discovery explicit and does not convert it into a claim', () => {
    expect.hasAssertions();

    const result = worklistModule.buildWorklist({
      files: [
        {
          path: 'ClientApp/src/components/index.ts',
          content: "export { Missing } from './missing';\n",
        },
      ],
    });

    expect(result.worklist).toStrictEqual([
      {
        source: 'ClientApp/src/components/index.ts',
        export: 'Missing',
        discoveryKind: 'unresolved',
        unresolvedReason: 'module not found',
        proposedClassification: null,
        owner: 'unassigned',
        batch: 'components',
        status: 'blocked',
      },
    ]);
    expect(result.summary.categoryCounts).toMatchObject({ unresolved: 1 });
    expect(result.summary.discoveredExportsWithDiagnostics).toBe(0);
    expect(result.summary.diagnosticCount).toBe(2);
  });
});
