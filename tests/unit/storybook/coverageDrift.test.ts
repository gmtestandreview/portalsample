import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  readDirectorySync,
  readTextFileSync,
} from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const sourceRoot = path.join(repoRoot, 'ClientApp', 'src');

const coverageMatrixPath = path.join(
  sourceRoot,
  'storybook',
  'CoverageMatrix.docs.mdx',
);

const readDirs = (dir: string) =>
  readDirectorySync(dir, repoRoot)
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

describe('storybook coverage drift', () => {
  const coverageDoc = readTextFileSync(coverageMatrixPath, repoRoot);
  it('every route family directory is registered in CoverageMatrix.docs.mdx', () => {
    expect.assertions(1);
    const routesDir = path.join(sourceRoot, 'routes');
    const families = readDirs(routesDir);
    const unregistered = families.filter((f) => !coverageDoc.includes(f));

    expect(
      unregistered,
      `New route families not registered in CoverageMatrix.docs.mdx — add them to the Route Coverage Matrix or the explicit exclusion table:\n  ${unregistered.join('\n  ')}`,
    ).toHaveLength(0);
  });
});

describe('storybook coverage drift', () => {
  const coverageDoc = readTextFileSync(coverageMatrixPath, repoRoot);
  it('every component family directory is registered in CoverageMatrix.docs.mdx', () => {
    expect.assertions(1);
    const componentsDir = path.join(sourceRoot, 'components');
    const families = readDirs(componentsDir);
    const unregistered = families.filter((f) => !coverageDoc.includes(f));

    expect(
      unregistered,
      `New component families not registered in CoverageMatrix.docs.mdx — add them to the Component Coverage Matrix with an "Interactive", "Docs only", or "Explicit exclusion" status:\n  ${unregistered.join('\n  ')}`,
    ).toHaveLength(0);
  });
});

describe('storybook coverage drift', () => {
  const coverageDoc = readTextFileSync(coverageMatrixPath, repoRoot);
  it('phase 4 remains open until closure evidence passes', () => {
    expect.assertions(2);
    expect(coverageDoc).toContain('Phase 4: Closure');
    expect(coverageDoc).toMatch(/'Phase 4: Closure',\s*'Open'/);
  });
});
