import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { routeCoverage } from '../../e2e/route-coverage';

import { pathExists, readTextFileSync } from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const appSource = readTextFileSync(
  path.join(repoRoot, 'ClientApp', 'src', 'App.tsx'),
  repoRoot,
);

const declaredPaths = Array.from(
  appSource.matchAll(/<Route\s+path='([^']+)'/g),
  (match) => match[1],
).filter((routePath): routePath is string => routePath !== undefined);

describe('playwright-BDD route coverage manifest', () => {
  it('registers every route declared in App.tsx exactly once', () => {
    expect.assertions(2);
    const registered = routeCoverage.map(({ path: routePath }) => routePath);
    const sortRoutes = (routes: string[]) =>
      [...routes].sort((left: string, right: string) =>
        left.localeCompare(right),
      );

    expect(new Set(registered).size).toBe(registered.length);
    expect(sortRoutes(registered)).toEqual(sortRoutes(declaredPaths));
  });
});

describe('playwright-BDD route coverage manifest', () => {
  it('uses feature and scenario references that exist on disk', () => {
    expect.assertions(1);
    for (const entry of routeCoverage) {
      if (entry.status === 'excluded') {
        expect(entry.reason.length).toBeGreaterThan(20);
      } else {
        const featurePath = path.join(repoRoot, ...entry.feature.split('/'));

        const featureSource = readTextFileSync(featurePath, repoRoot);
      }
    }
  });
});

describe('playwright-BDD route coverage manifest', () => {
  it('uses feature and scenario references that exist on disk', () => {
    expect.assertions(1);
    for (const entry of routeCoverage) {
      if (entry.status === 'excluded') {
        expect(entry.feature).toBeUndefined();
      } else {
        const featurePath = path.join(repoRoot, ...entry.feature.split('/'));

        const featureSource = readTextFileSync(featurePath, repoRoot);
      }
    }
  });
});

describe('playwright-BDD route coverage manifest', () => {
  it('uses feature and scenario references that exist on disk', () => {
    expect.assertions(1);
    for (const entry of routeCoverage) {
      if (entry.status === 'excluded') {
      } else {
        expect(entry.feature).toMatch(/^tests\/e2e\/features\/.+\.feature$/);

        const featurePath = path.join(repoRoot, ...entry.feature.split('/'));

        const featureSource = readTextFileSync(featurePath, repoRoot);
      }
    }
  });
});
