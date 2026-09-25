import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const sourceRoot = path.join(repoRoot, 'ClientApp', 'src');
const coverageMatrixPath = path.join(sourceRoot, 'storybook', 'CoverageMatrix.docs.mdx');

const readDirs = (dir: string) =>
    fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

describe('Storybook coverage drift', () => {
    const coverageDoc = fs.readFileSync(coverageMatrixPath, 'utf8');

    it('every route family directory is registered in CoverageMatrix.docs.mdx', () => {
        const routesDir = path.join(sourceRoot, 'routes');
        const families = readDirs(routesDir);
        const unregistered = families.filter((f) => !coverageDoc.includes(f));

        expect(
            unregistered,
            `New route families not registered in CoverageMatrix.docs.mdx — add them to the Route Coverage Matrix or the explicit exclusion table:\n  ${unregistered.join('\n  ')}`,
        ).toHaveLength(0);
    });

    it('every component family directory is registered in CoverageMatrix.docs.mdx', () => {
        const componentsDir = path.join(sourceRoot, 'components');
        const families = readDirs(componentsDir);
        const unregistered = families.filter((f) => !coverageDoc.includes(f));

        expect(
            unregistered,
            `New component families not registered in CoverageMatrix.docs.mdx — add them to the Component Coverage Matrix with an "Interactive", "Docs only", or "Explicit exclusion" status:\n  ${unregistered.join('\n  ')}`,
        ).toHaveLength(0);
    });

    it('Phase 4 is marked Complete in the phase status table', () => {
        expect(coverageDoc).toContain('Phase 4: Closure');
        expect(coverageDoc).toContain("['Phase 4: Closure', 'Complete'");
    });

    it('RouteLeavingGuard is registered with a non-Docs-only status', () => {
        const guardRow = coverageDoc.split('\n').find((l) => l.includes('RouteLeavingGuard'));
        expect(guardRow, 'RouteLeavingGuard row not found in CoverageMatrix').toBeDefined();
        expect(guardRow).not.toContain('Docs only');
    });
});
