import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  readDirectorySync,
  readTextFileSync,
} from '../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '..', '..');

const read = (...segments: string[]) =>
  readTextFileSync(path.join(repoRoot, ...segments), repoRoot);

const readSource = (...segments: string[]) =>
  read('ClientApp', 'src', ...segments);

describe('storybook migration inventory', () => {
  const overviewDoc = readSource('storybook', 'MigrationReadiness.docs.mdx');
  const coverageDoc = readSource('storybook', 'CoverageMatrix.docs.mdx');
  const routeDoc = readSource('routes', 'RouteInventory.docs.mdx');
  const componentDoc = readSource('components', 'ComponentInventory.docs.mdx');
  const authDoc = readSource('authentication', 'Authentication.docs.mdx');
  const validationDoc = readSource(
    'validationSchemas',
    'ValidationSchemas.docs.mdx',
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');
  it('documents all migration artifact classes in the overview page', () => {
    expect.assertions(1);
    expect(overviewDoc).toContain('Routes and route wrappers');
  });
});

describe('storybook migration inventory', () => {
  const overviewDoc = readSource('storybook', 'MigrationReadiness.docs.mdx');
  const coverageDoc = readSource('storybook', 'CoverageMatrix.docs.mdx');
  const routeDoc = readSource('routes', 'RouteInventory.docs.mdx');
  const componentDoc = readSource('components', 'ComponentInventory.docs.mdx');
  const authDoc = readSource('authentication', 'Authentication.docs.mdx');
  const validationDoc = readSource(
    'validationSchemas',
    'ValidationSchemas.docs.mdx',
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');
  it('documents all migration artifact classes in the overview page', () => {
    expect.assertions(1);
    expect(overviewDoc).toContain('Reusable components and component families');
  });
});

describe('storybook migration inventory', () => {
  const overviewDoc = readSource('storybook', 'MigrationReadiness.docs.mdx');
  const coverageDoc = readSource('storybook', 'CoverageMatrix.docs.mdx');
  const routeDoc = readSource('routes', 'RouteInventory.docs.mdx');
  const componentDoc = readSource('components', 'ComponentInventory.docs.mdx');
  const authDoc = readSource('authentication', 'Authentication.docs.mdx');
  const validationDoc = readSource(
    'validationSchemas',
    'ValidationSchemas.docs.mdx',
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');
  it('documents all migration artifact classes in the overview page', () => {
    expect.assertions(1);
    expect(overviewDoc).toContain(
      'Authentication providers, guards, and account context contracts',
    );
  });
});

describe('storybook migration inventory', () => {
  const overviewDoc = readSource('storybook', 'MigrationReadiness.docs.mdx');
  const coverageDoc = readSource('storybook', 'CoverageMatrix.docs.mdx');
  const routeDoc = readSource('routes', 'RouteInventory.docs.mdx');
  const componentDoc = readSource('components', 'ComponentInventory.docs.mdx');
  const authDoc = readSource('authentication', 'Authentication.docs.mdx');
  const validationDoc = readSource(
    'validationSchemas',
    'ValidationSchemas.docs.mdx',
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');
  it('documents all migration artifact classes in the overview page', () => {
    expect.assertions(1);
    expect(overviewDoc).toContain(
      'Validation schemas and custom Yup extensions',
    );
  });
});

describe('storybook migration inventory', () => {
  const overviewDoc = readSource('storybook', 'MigrationReadiness.docs.mdx');
  const coverageDoc = readSource('storybook', 'CoverageMatrix.docs.mdx');
  const routeDoc = readSource('routes', 'RouteInventory.docs.mdx');
  const componentDoc = readSource('components', 'ComponentInventory.docs.mdx');
  const authDoc = readSource('authentication', 'Authentication.docs.mdx');
  const validationDoc = readSource(
    'validationSchemas',
    'ValidationSchemas.docs.mdx',
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');
  it('documents all migration artifact classes in the overview page', () => {
    expect.assertions(1);
    expect(overviewDoc).toContain(
      'Assets and media, including SVGs, fonts, and the MSW worker',
    );
  });
});
