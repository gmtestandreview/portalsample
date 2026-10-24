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
    'ValidationSchemas.docs.mdx'
  );
  const assetDoc = readSource('assets', 'AssetsAndMedia.docs.mdx');

  it('documents all migration artifact classes in the overview page', () => {
    expect(overviewDoc).toContain('Routes and route wrappers');
    expect(overviewDoc).toContain('Reusable components and component families');
    expect(overviewDoc).toContain(
      'Authentication providers, guards, and account context contracts'
    );
    expect(overviewDoc).toContain(
      'Validation schemas and custom Yup extensions'
    );
    expect(overviewDoc).toContain(
      'Assets and media, including SVGs, fonts, and the MSW worker'
    );
    expect(overviewDoc).toContain('Migration/Coverage Matrix');
  });

  it('documents the current Storybook coverage baseline and closure plan', () => {
    expect(coverageDoc).toContain('Route-level interactive stories');
    expect(coverageDoc).toContain('Component Coverage Matrix');
    expect(coverageDoc).toContain('Platform Coverage Matrix');
    expect(coverageDoc).toContain('Plan to Reach Full Coverage');
    expect(coverageDoc).toContain('Inputs');
    expect(coverageDoc).toContain('Dashboard');
  });

  it('documents every App route path in the route inventory page', () => {
    const appSource = readSource('App.tsx');
    const rawPaths = [...appSource.matchAll(/path='([^']+)'/g)].map(
      (match) => match[1]
    );
    // Child wildcard routes ('*') are documented as 'parent/*' in the inventory,
    // not as standalone rows. Strip all bare '*' entries then restore the
    // top-level catch-all once.
    const uniquePaths = [...new Set(rawPaths.filter((p) => p !== '*'))];
    if (rawPaths.includes('*')) uniquePaths.push('*');

    expect(uniquePaths.length).toBeGreaterThan(20);

    uniquePaths.forEach((routePath) => {
      // The doc may record a parent + wildcard-child route as 'path/*'.
      const inDoc =
        routeDoc.includes(`['\`${routePath}\`',`) ||
        routeDoc.includes(`['\`${routePath}/*\`',`);

      expect(
        inDoc,
        `"${routePath}" not documented in RouteInventory.docs.mdx`
      ).toBe(true);
    });
  });

  it('documents every top-level component family directory', () => {
    const componentDirectories = readDirectorySync(
      path.join(repoRoot, 'ClientApp', 'src', 'components'),
      repoRoot
    )
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
    const componentTableRows = componentDoc
      .split(/\r?\n/)
      .map((line) => line.split('|').map((cell) => cell.trim()));

    componentDirectories.forEach((directory) => {
      expect(
        componentTableRows.some((cells) => cells.includes(`\`${directory}\``)),
        `"${directory}" not documented in ComponentInventory.docs.mdx`
      ).toBe(true);
    });
  });

  it('documents every authentication source file', () => {
    const authFiles = readDirectorySync(
      path.join(repoRoot, 'ClientApp', 'src', 'authentication'),
      repoRoot
    ).filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
    );

    authFiles.forEach((entry) => {
      expect(authDoc).toContain(`\`${entry.name}\``);
    });
  });

  it('documents the validation schema files and custom Yup methods', () => {
    [
      'common.ts',
      'addressValidation.ts',
      'contactValidation.ts',
      'yupExtensions/index.ts',
      'yupExtensions/stringExtensions.ts',
      'fixedDigits',
      'phone',
      'allowedFormat',
      'nameAllowedFormat',
      'minEntered',
      'maxLength',
    ].forEach((entry) => {
      expect(validationDoc).toContain(`\`${entry}\``);
    });
  });

  it('documents the asset, font, and worker files required for migration', () => {
    [
      'GovCrest.svg',
      'DI_CoatOfArms.svg',
      'Stepper.svg',
      'fonts/PublicSans-Regular.ttf',
      'fonts/PublicSans-Bold.ttf',
      'fonts/nmi-iconfonts.woff',
      'fonts/fonts.css',
      'fonts/nmi-iconfonts.css',
      'static/css/styles/index.scss',
      'static/css/styles/media-print.scss',
      'public/mockServiceWorker.js',
    ].forEach((entry) => {
      expect(assetDoc).toContain(`\`${entry}\``);
    });
  });
});
