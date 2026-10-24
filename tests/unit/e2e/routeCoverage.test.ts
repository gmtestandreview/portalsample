import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { routeCoverage } from '../../e2e/route-coverage';
import { pathExists, readTextFileSync } from '../../helpers/safeTestFilesystem';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const appSource = readTextFileSync(
  path.join(repoRoot, 'ClientApp', 'src', 'App.tsx'),
  repoRoot
);

const declaredPaths = Array.from(
  appSource.matchAll(/<Route\s+path='([^']+)'/g),
  (match) => match[1]
).filter((routePath): routePath is string => routePath !== undefined);

describe('playwright-BDD route coverage manifest', () => {
  it('registers every route declared in App.tsx exactly once', () => {
    const registered = routeCoverage.map(({ path: routePath }) => routePath);
    const sortRoutes = (routes: string[]) =>
      [...routes].sort((left: string, right: string) =>
        left.localeCompare(right)
      );

    expect(new Set(registered).size).toBe(registered.length);
    expect(sortRoutes(registered)).toEqual(sortRoutes(declaredPaths));
  });

  it('uses feature and scenario references that exist on disk', () => {
    for (const entry of routeCoverage) {
      if (entry.status === 'excluded') {
        expect(entry.reason.length).toBeGreaterThan(20);
        expect(entry.feature).toBeUndefined();
      } else {
        expect(entry.feature).toMatch(/^tests\/e2e\/features\/.+\.feature$/);
        expect(entry.scenario).toBeDefined();

        const featurePath = path.join(repoRoot, ...entry.feature.split('/'));

        expect(
          pathExists(featurePath, repoRoot),
          `${entry.feature} should exist`
        ).toBe(true);

        const featureSource = readTextFileSync(featurePath, repoRoot);

        expect(
          featureSource,
          `${entry.scenario} should exist in ${entry.feature}`
        ).toContain(`Scenario: ${entry.scenario}`);
      }
    }
  });

  it('does not retain temporary planned entries', () => {
    expect(
      routeCoverage.filter((entry) => (entry.status as string) === 'planned')
    ).toEqual([]);
  });

  it('maps all 41 declared routes to executable BDD scenarios', () => {
    expect(declaredPaths).toHaveLength(41);
    expect(routeCoverage).toHaveLength(41);
    expect(
      routeCoverage.filter((entry) => entry.status === 'excluded')
    ).toEqual([]);
  });
});
