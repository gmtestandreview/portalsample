import { describe, it, expect } from 'vitest';
import path from 'node:path';

import { readDirectory, readTextFile } from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const sourceRoot = path.join(repositoryRoot, 'ClientApp/src');
const environmentSourcePath = path.join(sourceRoot, 'env.ts');
const designPath = path.join(
  repositoryRoot,
  'docs/specs/2026-10-20-webpack-to-vite-design.md'
);

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const legacyReferencePattern =
  /\b(?:REACT_APP_[A-Z0-9_]+|EXTERNAL_REDIRECT_URL)\b/u;
const processEnvReferencePattern = /\bprocess\.env\b/u;
const excludedSourceDirectories = new Set([
  path.join(sourceRoot, 'parent'),
  path.join(sourceRoot, 'external'),
]);

const readSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readDirectory(directory, repositoryRoot);
  const contents: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!excludedSourceDirectories.has(entryPath)) {
        contents.push(...(await readSourceFiles(entryPath)));
      }
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      contents.push(await readTextFile(entryPath, repositoryRoot));
    }
  }

  return contents;
};

const mappingRows = (design: string) =>
  [...design.matchAll(/^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|$/gmu)].map(
    ([, legacyName, viteName]) => ({
      legacyName,
      viteName: viteName?.replaceAll('`', ''),
    })
  );

describe('browser environment contract', () => {
  it('reads every browser variable from Vite import.meta.env', async () => {
    const [environmentSource, design] = await Promise.all([
      readTextFile(environmentSourcePath, repositoryRoot),
      readTextFile(designPath, repositoryRoot),
    ]);
    const mapping = mappingRows(design);

    const viteMappings = mapping.filter(
      (mappingRow): mappingRow is { legacyName: string; viteName: string } =>
        mappingRow.viteName?.startsWith('VITE_') === true
    );

    for (const { viteName } of viteMappings) {
      expect(environmentSource).toContain(`import.meta.env.${viteName}`);
    }

    expect(environmentSource).toMatch(/import\.meta\.env\.(?:DEV|PROD|MODE)/u);
  });

  it('preserves the application-facing env export while using the Vite contract', async () => {
    const environmentSource = await readTextFile(
      environmentSourcePath,
      repositoryRoot
    );

    expect(environmentSource).toContain('export const env');
    expect(environmentSource).toContain('VITE_ENVIRONMENT');
    expect(environmentSource).not.toMatch(/globalThis\.[A-Z_]*REACT_APP_/u);
  });
});

describe('browser source environment policy', () => {
  it('contains no legacy names or custom process.env access outside vendored parent code', async () => {
    const sourceFiles = await readSourceFiles(sourceRoot);

    for (const [index, source] of sourceFiles.entries()) {
      expect(source, `browser source file ${index}`).not.toMatch(
        legacyReferencePattern
      );
      expect(source, `browser source file ${index}`).not.toMatch(
        processEnvReferencePattern
      );
    }
  });
});
