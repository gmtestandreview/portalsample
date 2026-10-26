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
    expect.hasAssertions();

    const registered = routeCoverage.map(({ path: routePath }) => routePath);
    const sortRoutes = (routes: string[]) =>
      [...routes].sort((left: string, right: string) =>
        left.localeCompare(right),
      );

    expect(new Set(registered).size).toBe(registered.length);
    expect(sortRoutes(registered)).toStrictEqual(sortRoutes(declaredPaths));
  });

  it('uses feature and scenario references that exist on disk', () => {
    expect.hasAssertions();

    for (const entry of routeCoverage) {
      if (entry.status === 'excluded') {
        expect({
          hasReason: entry.reason.length > 20,
          feature: entry.feature,
        }).toStrictEqual({ hasReason: true, feature: undefined });
      } else {
        const featurePath = path.join(repoRoot, ...entry.feature.split('/'));
        const featureSource = readTextFileSync(featurePath, repoRoot);

        expect({
          feature: /^tests\/e2e\/features\/.+\.feature$/.test(entry.feature),
          scenario: entry.scenario !== undefined,
          featureExists: pathExists(featurePath, repoRoot),
          scenarioExists: featureSource.includes(`Scenario: ${entry.scenario}`),
        }).toStrictEqual({
          feature: true,
          scenario: true,
          featureExists: true,
          scenarioExists: true,
        });
      }
    }
  });

  it('does not retain temporary planned entries', () => {
    expect.hasAssertions();

    expect(
      routeCoverage.filter((entry) => (entry.status as string) === 'planned'),
    ).toStrictEqual([]);
  });

  it('maps all 41 declared routes to executable BDD scenarios', () => {
    expect.hasAssertions();

    expect(declaredPaths).toHaveLength(41);
    expect(routeCoverage).toHaveLength(41);
    expect(
      routeCoverage.filter((entry) => entry.status === 'excluded'),
    ).toStrictEqual([]);
  });
});
