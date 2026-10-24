import { describe, it, expect } from 'vitest';
import path from 'node:path';

import {
  pathExists,
  readDirectorySync,
  readTextFileSync,
} from '../../helpers/safeTestFilesystem';

const repositoryRoot = path.resolve(__dirname, '../../..');
const componentsRoot = path.join(repositoryRoot, 'ClientApp/src/components');

const evaluationDirectories = ['AriaComponents'].map((directory) =>
  path.join(componentsRoot, directory)
);

function collectFiles(directory: string): string[] {
  return readDirectorySync(directory, repositoryRoot).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

const evaluationFiles = evaluationDirectories.flatMap(collectFiles);
const storyFiles = evaluationFiles.filter((file) => {
  if (!file.endsWith('.stories.tsx')) return false;
  return /title:\s*['"]Evaluation\/React Aria\//.test(
    readTextFileSync(file, repositoryRoot)
  );
});
const sourceFiles = evaluationFiles.filter(
  (file) =>
    /\.(?:css|ts|tsx)$/.test(file) &&
    !/(?:\.stories copy\.tsx|\/main\.tsx|\\main\.tsx|setup(?:Browser)?Tests\.ts|testStyleMock\.ts)$/.test(
      file
    )
);

function findRelativeImports(file: string): string[] {
  const source = readTextFileSync(file, repositoryRoot);
  const patterns = [
    /\bfrom\s+['"](\.[^'"]+)['"]/g,
    /\bimport\s+['"](\.[^'"]+)['"]/g,
    /@import\s+['"](\.[^'"]+)['"]/g,
  ];

  return patterns.flatMap((pattern) =>
    [...source.matchAll(pattern)]
      .map((match) => match[1])
      .filter((specifier): specifier is string => specifier !== undefined)
  );
}

function importResolves(importer: string, specifier: string): boolean {
  const basePath = path.resolve(path.dirname(importer), specifier);
  return [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.css`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ].some((candidate) => pathExists(candidate, repositoryRoot));
}

describe('react Aria Storybook evaluation contract', () => {
  it('keeps all 48 reusable component stories discoverable and isolated', () => {
    expect(storyFiles).toHaveLength(48);

    for (const file of storyFiles) {
      const source = readTextFileSync(file, repositoryRoot);

      expect(source, file).toContain("from '@storybook/react-vite'");
      expect(source, file).toMatch(/title:\s*['"]Evaluation\/React Aria\//);
      expect(source, file).toContain('satisfies Meta');
      expect(source, file).not.toContain('../src/');
      expect(source, file).not.toContain("from '@storybook/react'");
    }
  });

  it('uses NMI icons rather than Lucide in the first-instance evaluation', () => {
    for (const file of sourceFiles.filter((file) => /\.tsx?$/.test(file))) {
      expect(readTextFileSync(file, repositoryRoot), file).not.toContain(
        'lucide-react'
      );
    }
  });

  it('resolves every relative import in the reusable evaluation surface', () => {
    const unresolved = sourceFiles.flatMap((file) =>
      findRelativeImports(file)
        .filter((specifier) => !importResolves(file, specifier))
        .map(
          (specifier) =>
            `${path.relative(repositoryRoot, file)} -> ${specifier}`
        )
    );

    expect(unresolved).toEqual([]);
  });

  it('scopes React Aria theme variables to the evaluation surface', () => {
    const themeFile = path.join(componentsRoot, 'AriaComponents/theme.css');
    const source = readTextFileSync(themeFile, repositoryRoot);

    expect(source).toContain('.react-aria-evaluation');
    expect(source).not.toMatch(/(^|[\s,]):root\b/m);
  });

  it('type-checks the evaluation surface with no demo-only carve-outs', () => {
    // The three excludes that stood here carved live directories out of the
    // TypeScript program to hide a broken scaffold. `components/App` never
    // existed, `AriaComponents/main.tsx` imported an absent `App.tsx`, and
    // `reactaria_components/AlertMessage.tsx` imported an absent
    // `ClientApp/src/Content`. The scaffold is kept and repaired, so the
    // carve-outs are gone and `tsc --noEmit` covers it like any other source.
    const tsconfig = readTextFileSync(
      path.join(repositoryRoot, 'tsconfig.json'),
      repositoryRoot
    );

    expect(tsconfig).not.toContain('ClientApp/src/components/App/**');
    expect(tsconfig).not.toContain(
      'ClientApp/src/components/AriaComponents/main.tsx'
    );
    expect(tsconfig).not.toContain(
      'ClientApp/src/components/reactaria_components/**'
    );
  });

  it('keeps the retained reactaria_components scaffold import-resolvable', () => {
    const scaffoldRoot = path.join(componentsRoot, 'reactaria_components');
    const scaffoldSources = collectFiles(scaffoldRoot).filter((file) =>
      /\.tsx?$/.test(file)
    );

    expect(scaffoldSources.length).toBeGreaterThan(0);

    const unresolved = scaffoldSources.flatMap((file) =>
      findRelativeImports(file)
        .filter((specifier) => !importResolves(file, specifier))
        .map(
          (specifier) =>
            `${path.relative(repositoryRoot, file)} -> ${specifier}`
        )
    );

    expect(unresolved).toEqual([]);
  });

  it('removes the dead AriaComponents entry point', () => {
    expect(
      pathExists(
        path.join(componentsRoot, 'AriaComponents/main.tsx'),
        repositoryRoot
      )
    ).toBe(false);
  });
});
