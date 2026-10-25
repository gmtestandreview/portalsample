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
  path.join(componentsRoot, directory),
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
    readTextFileSync(file, repositoryRoot),
  );
});

const sourceFiles = evaluationFiles.filter(
  (file) =>
    /\.(?:css|ts|tsx)$/.test(file) &&
    !/(?:\.stories copy\.tsx|\/main\.tsx|\\main\.tsx|setup(?:Browser)?Tests\.ts|testStyleMock\.ts)$/.test(
      file,
    ),
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
      .filter((specifier): specifier is string => specifier !== undefined),
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
    expect.assertions(1);
    expect(storyFiles).toHaveLength(48);
  });
});

describe('react Aria Storybook evaluation contract', () => {
  it('keeps all 48 reusable component stories discoverable and isolated', () => {
    expect.assertions(1);
    for (const file of storyFiles) {
      const source = readTextFileSync(file, repositoryRoot);

      expect(source, file).toContain("from '@storybook/react-vite'");
    }
  });
});

describe('react Aria Storybook evaluation contract', () => {
  it('keeps all 48 reusable component stories discoverable and isolated', () => {
    expect.assertions(1);
    for (const file of storyFiles) {
      const source = readTextFileSync(file, repositoryRoot);

      expect(source, file).toMatch(/title:\s*['"]Evaluation\/React Aria\//);
    }
  });
});

describe('react Aria Storybook evaluation contract', () => {
  it('keeps all 48 reusable component stories discoverable and isolated', () => {
    expect.assertions(1);
    for (const file of storyFiles) {
      const source = readTextFileSync(file, repositoryRoot);

      expect(source, file).toContain('satisfies Meta');
    }
  });
});

describe('react Aria Storybook evaluation contract', () => {
  it('keeps all 48 reusable component stories discoverable and isolated', () => {
    expect.assertions(1);
    for (const file of storyFiles) {
      const source = readTextFileSync(file, repositoryRoot);

      expect(source, file).not.toContain('../src/');
    }
  });
});
