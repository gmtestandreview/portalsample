import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { routeCoverage } from '../../e2e/route-coverage';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const appSource = fs.readFileSync(
    path.join(repoRoot, 'ClientApp', 'src', 'App.tsx'),
    'utf8',
);

const declaredPaths = Array.from(
    appSource.matchAll(/<Route\s+path='([^']+)'/g),
    (match) => match[1],
);

describe('Playwright-BDD route coverage manifest', () => {
    it('registers every route declared in App.tsx exactly once', () => {
        const registered = routeCoverage.map(({ path: routePath }) => routePath);
        const sortRoutes = (routes: string[]) => [...routes].sort((left: string, right: string) => left.localeCompare(right));
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
                expect(entry.scenario).toBeTruthy();
                const featurePath = path.join(repoRoot, ...entry.feature.split('/'));
                expect(fs.existsSync(featurePath), `${entry.feature} should exist`).toBe(true);
                const featureSource = fs.readFileSync(featurePath, 'utf8');
                const escapedScenario = entry.scenario.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                expect(
                    featureSource,
                    `${entry.scenario} should exist in ${entry.feature}`,
                ).toMatch(new RegExp(`^\\s*Scenario(?: Outline)?:\\s*${escapedScenario}\\s*$`, 'm'));
            }
        }
    });

    it('does not retain temporary planned entries', () => {
        expect(routeCoverage.filter((entry) => (
            (entry.status as string) === 'planned'
        ))).toEqual([]);
    });

    it('maps all 41 declared routes to executable BDD scenarios', () => {
        expect(declaredPaths).toHaveLength(41);
        expect(routeCoverage).toHaveLength(41);
        expect(routeCoverage.filter((entry) => entry.status === 'excluded')).toEqual([]);
    });
});
