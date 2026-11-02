import { describe, expect, it } from 'vitest';

import { readTextFileSync } from '../../helpers/safeTestFilesystem';

type PackageManifest = {
  engines?: { node?: string };
  devDependencies?: { storybook?: string };
};

const repositoryRoot = process.cwd();

const packageManifest = JSON.parse(
  readTextFileSync('package.json', repositoryRoot),
) as PackageManifest;

const nodeVersion = packageManifest.engines?.node;
const storybookVersion = packageManifest.devDependencies?.storybook;
const nodeRelease = nodeVersion?.replace(/^>=/u, '');

if (
  nodeVersion === undefined ||
  nodeRelease === undefined ||
  storybookVersion === undefined
) {
  throw new Error(
    'The package manifest must declare Node and Storybook versions',
  );
}

const nodeDocumentation = [
  'README.md',
  'INIT.md',
  'docs/CONVENTIONS.md',
  'docs/STACK.md',
  'docs/TESTING.md',
  '.storybook/introduction.mdx',
];

const storybookDocumentation = ['.storybook/component-docs-guide.mdx'];

describe('current documentation version contracts', () => {
  it('keeps standing Node.js guidance aligned with package.json', () => {
    expect.assertions(12);

    for (const filePath of nodeDocumentation) {
      const contents = readTextFileSync(filePath, repositoryRoot);

      expect(contents).toContain(nodeRelease);
      expect(contents).not.toContain('24.0.0');
    }
  });

  it('keeps Storybook guidance aligned with the installed package', () => {
    expect.assertions(2);

    for (const filePath of storybookDocumentation) {
      const contents = readTextFileSync(filePath, repositoryRoot);

      expect(contents).toContain(`Storybook ${storybookVersion}`);
      expect(contents).not.toContain('Storybook 10.6.1');
    }
  });
});
