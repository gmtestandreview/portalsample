import { describe, expect, it } from 'vitest';

type WorklistModule = {
  buildWorklist(input: {
    files: Array<{ path: string; content: string }>;
    candidateFiles?: Array<{ path: string; reason?: string }>;
  }): {
    worklist: Array<{
      source: string;
      export: string;
      discoveryKind: string;
      unresolvedReason: string | null;
      proposedClassification: string | null;
      owner: string;
      batch: string;
      status: string;
    }>;
    summary: {
      categoryCounts: Record<string, number>;
      diagnosticCount: number;
      discoveredExportsWithDiagnostics: number;
    };
  };
};

const worklistModule =
  // @ts-expect-error The maintained generator is JavaScript and has no declaration file.
  (await import('../../../scripts/storybook-coverage-worklist.mjs')) as WorklistModule;

describe('storybook coverage worklist', () => {
  it('uses declaration-aware discovery and emits a deterministic reviewed queue', () => {
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
      ],
    };

    const first = worklistModule.buildWorklist(input);
    const second = worklistModule.buildWorklist({
      files: [...input.files].reverse(),
      candidateFiles: [...(input.candidateFiles ?? [])].reverse(),
    });

    expect(first).toEqual(second);
    expect(first.worklist).toEqual([
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
    expect(first.summary).toEqual({
      categoryCounts: {
        direct: 1,
        consumer: 0,
        forwarding: 0,
        nonvisual: 1,
        unresolved: 0,
        excludedByPolicy: 1,
      },
      discoveredExports: 2,
      diagnosticCount: 3,
      discoveredExportsWithDiagnostics: 2,
      unresolvedEntries: 0,
      excludedPaths: [
        {
          path: 'ClientApp/src/utils/index.ts',
          reason: 'outside inventory roots',
        },
      ],
    });
  });

  it('keeps unresolved discovery explicit and does not convert it into a claim', () => {
    const result = worklistModule.buildWorklist({
      files: [
        {
          path: 'ClientApp/src/components/index.ts',
          content: "export { Missing } from './missing';\n",
        },
      ],
    });

    expect(result.worklist).toEqual([
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
