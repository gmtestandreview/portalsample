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

const scenarioContract = (scenario: unknown, featureSource: string) => {
  const hasScenario =
    typeof scenario === 'string' && scenario.trim().length > 0;

  return {
    scenario: hasScenario,
    scenarioExists:
      hasScenario &&
      featureSource
        .split(/\r?\n/u)
        .some((line) => line.trim() === `Scenario: ${scenario}`),
  };
};

const coverageEntryContract = (entry: (typeof routeCoverage)[number]) => {
  if (entry.status === 'excluded') {
    return {
      hasReason: entry.reason.length > 20,
      feature: entry.feature,
    };
  }

  const featurePath = path.join(repoRoot, ...entry.feature.split('/'));
  const featureSource = readTextFileSync(featurePath, repoRoot);
  const scenario: unknown = entry.scenario;
  return {
    feature: /^tests\/e2e\/features\/.+\.feature$/.test(entry.feature),
    ...scenarioContract(scenario, featureSource),
    featureExists: pathExists(featurePath, repoRoot),
  };
};

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
      expect(coverageEntryContract(entry)).toStrictEqual(
        entry.status === 'excluded'
          ? { hasReason: true, feature: undefined }
          : {
              feature: true,
              scenario: true,
              featureExists: true,
              scenarioExists: true,
            },
      );
    }
  });

  it.each([
    ['missing', undefined, false, false],
    ['empty', '', false, false],
    ['whitespace-only', '   ', false, false],
    ['valid', 'Authenticated user lands on the dashboard', true, true],
    ['valid-but-missing', 'A scenario that is not in the feature', true, false],
    ['valid-prefix-only', 'Authenticated user lands', true, false],
  ])(
    'requires a non-empty scenario reference for %s entries',
    (_label, scenario, expectedScenario, expectedPresence) => {
      expect.hasAssertions();

      const featurePath = path.join(
        repoRoot,
        'tests',
        'e2e',
        'features',
        'auth',
        'login.feature',
      );
      const featureSource = readTextFileSync(featurePath, repoRoot);

      expect(scenarioContract(scenario, featureSource)).toStrictEqual({
        scenario: expectedScenario,
        scenarioExists: expectedPresence,
      });
    },
  );

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
