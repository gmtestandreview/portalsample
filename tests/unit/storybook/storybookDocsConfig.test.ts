import ts from 'typescript';

import type { UserConfig } from 'vite';

import { describe, expect, it } from 'vitest';

import storybookConfig from '../../../.storybook/main';

import { onLog } from '../../../.storybook/rollupOnLog';

import { pathExists, readTextFileSync } from '../../helpers/safeTestFilesystem';

const testRoot = process.cwd();

const readFileSync = (filePath: string, _encoding: 'utf8'): string =>
  readTextFileSync(filePath, testRoot);

const existsSync = (filePath: string): boolean =>
  pathExists(filePath, testRoot);

const main = readFileSync('.storybook/main.ts', 'utf8');

const preview = readFileSync('.storybook/preview.ts', 'utf8');

const previewHead = readFileSync('.storybook/preview-head.html', 'utf8');

const componentDocsGuide = readFileSync(
  '.storybook/component-docs-guide.mdx',
  'utf8',
);

const introduction = readFileSync('.storybook/introduction.mdx', 'utf8');

const styleGuide = readFileSync('.storybook/style-guide.mdx', 'utf8');

const scssVariables = readFileSync(
  'ClientApp/src/styles/_variables.scss',
  'utf8',
);

const docsVerifier = readFileSync('scripts/verify-storybook-docs.mjs', 'utf8');

const tsconfigJson = ts.parseConfigFileTextToJson(
  'tsconfig.json',
  readFileSync('tsconfig.json', 'utf8'),
).config as {
  compilerOptions?: { types?: string[] };
};

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

const declaredVersion = (packageName: string) =>
  Object.entries(allDependencies)
    .find(([dependencyName]) => dependencyName === packageName)?.[1]
    ?.replace(/^[~^]/, '');

const rawStoryFiles = import.meta.glob(
  '../../../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  { eager: true, import: 'default', query: '?raw' },
) as Record<string, string>;

const rawStandingGuidanceDocuments = {
  ...import.meta.glob('../../../docs/**/*.md', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  ...import.meta.glob('../../../.storybook/*.mdx', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
} as Record<string, string>;

const toRepoPath = (globPath: string) =>
  globPath.slice('../../../'.length).replace(/\\/g, '/');

const storyFiles = Object.entries(rawStoryFiles).map(
  ([globPath, contents]) => ({
    path: toRepoPath(globPath),
    contents,
  }),
);

/**
 * Directories that record what the documentation architecture *was* — baselines,
 * change records, plans, and review notes. They legitimately quote the removed
 * configuration as evidence, so they are history rather than standing guidance.
 */
const historicalRecordPaths = [
  'docs/change-record/',
  'docs/migration/',
  'docs/qa/',
  'docs/sprint-1/',
  'docs/superpowers/',
  'docs/storybook/storybook-refactor-baseline.md',
];

/**
 * Every document a developer could reasonably read as current instruction on how
 * to write Storybook documentation in this repository.
 */
const standingGuidanceDocuments = [
  ...Object.entries(rawStandingGuidanceDocuments).map(
    ([globPath, contents]) => ({
      path: toRepoPath(globPath),
      contents,
    }),
  ),
].filter(
  ({ path }) =>
    !historicalRecordPaths.some((prefix) => path.startsWith(prefix)),
);

/**
 * Architecture this refactor removed. Any standing guidance still teaching one of
 * these sends developers to a configuration the repository no longer has.
 */
const removedArchitecturePatterns: { label: string; pattern: RegExp }[] = [
  {
    label: "'docs' tag taught as the Autodocs trigger",
    pattern: /\b(?:add|added|adding)\s+the\s+['"`]docs['"`]\s+tag\b/i,
  },
  {
    label: "'docs' listed in a story tags array",
    pattern: /tags:\s*\[[^\]]*['"]docs['"]/,
  },
  {
    label: 'addon-level autodocs option',
    pattern: /autodocs:\s*['"]tag['"]/,
  },
  {
    label: 'removed canvas sourceState',
    pattern: /sourceState:\s*['"]shown['"]/,
  },
  {
    label: 'removed generic global component description',
    pattern:
      /Component documentation generated from JSDoc comments and Storybook autodocs/,
  },
  {
    label: 'removed cloned Autodocs template',
    pattern: /autoDocsTemplate/,
  },
  {
    label: 'removed Webpack-only styling addon',
    pattern: /@storybook\/addon-styling-webpack/,
  },
];

describe('storybook documentation architecture', () => {
  it('keeps AutoSuggest ownership and Loading controls truthful', () => {
    expect.assertions(4);
    const autoSuggestStory = readFileSync(
      'ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx',
      'utf8',
    );

    expect(autoSuggestStory).toMatch(
      /subcomponents:\s*\{\s*AutoSuggestContainer\s*\}/,
    );
    expect(autoSuggestStory).toMatch(
      /name:\s*['"]Loading \(AutoSuggestContainer\)['"]/,
    );
    expect(autoSuggestStory).toMatch(
      /Loading[\s\S]*argTypes:[\s\S]*getOptions:[\s\S]*table:\s*\{[\s\S]*disable:\s*true/,
    );
    expect(autoSuggestStory).toMatch(
      /Loading[\s\S]*argTypes:[\s\S]*selectedOption:[\s\S]*table:\s*\{[\s\S]*disable:\s*true/,
    );
  });
});
