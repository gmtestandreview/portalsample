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

    it('uses a feature reference or an explicit durable exclusion', () => {
        for (const entry of routeCoverage) {
            if (entry.status === 'excluded') {
                expect(entry.reason.length).toBeGreaterThan(20);
                expect(entry.feature).toBeUndefined();
            } else {
                expect(entry.feature).toMatch(/^tests\/e2e\/features\/.+\.feature$/);
                expect(entry.scenario).toBeTruthy();
            }
        }
    });

    it('does not retain temporary planned entries', () => {
        expect(routeCoverage.filter((entry) => (
            (entry.status as string) === 'planned'
        ))).toEqual([]);
    });
});
