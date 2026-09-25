import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import unitConfig from '../../../vitest.unit.config';

/**
 * Keeps SonarCloud and lcov measuring the same coverage denominator.
 *
 * `INIT.md` requires `sonar-project.properties` and the Vitest coverage
 * `exclude` list to agree. Changing one without the other splits the two gates:
 * a file Vitest never measures still counts against SonarCloud's coverage
 * percentage, so Sonar reports a shortfall that no local run can reproduce.
 *
 * The mirror target is `sonar.coverage.exclusions`, NOT `sonar.exclusions`.
 * `sonar.exclusions` drops files from analysis altogether — every bug, smell
 * and security rule stops running on them — which is far more than a coverage
 * carve-out and would silently shrink the defect surface. `sonar.exclusions`
 * stays scoped to generated and vendor code, which is what its own comment in
 * the properties file claims it is for.
 */

const repositoryRoot = path.resolve(__dirname, '../../..');

/**
 * Sonar path matchers are Ant-style and have no brace alternation, so a Vitest
 * pattern such as `*.test.{ts,tsx}` has to be carried across as two entries.
 */
function expandBraces(pattern: string): string[] {
    const match = /\{([^}]*)\}/.exec(pattern);
    if (!match) {
        return [pattern];
    }

    return match[1]
        .split(',')
        .flatMap((alternative) =>
            expandBraces(
                pattern.slice(0, match.index) +
                    alternative +
                    pattern.slice(match.index + match[0].length),
            ),
        );
}

function readSonarProperty(name: string): string[] {
    const source = readFileSync(
        path.join(repositoryRoot, 'sonar-project.properties'),
        'utf8',
    );
    // Property values continue across lines with a trailing backslash.
    const unwrapped = source.replace(/\\r?\n\s*/g, '');
    const line = unwrapped
        .split(/\r?\n/)
        .find((candidate) => candidate.startsWith(`${name}=`));

    if (line === undefined) {
        return [];
    }

    return line
        .slice(name.length + 1)
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

const vitestExcludes = unitConfig.test?.coverage?.exclude ?? [];

describe('sonar coverage denominator contract', () => {
    it('carries every Vitest coverage exclude into sonar.coverage.exclusions', () => {
        const sonarCoverageExclusions = readSonarProperty(
            'sonar.coverage.exclusions',
        );
        const required = vitestExcludes.flatMap(expandBraces);

        const missing = required.filter(
            (pattern) => !sonarCoverageExclusions.includes(pattern),
        );

        expect(
            missing,
            'these Vitest coverage excludes have no counterpart in sonar.coverage.exclusions, so SonarCloud measures files lcov does not',
        ).toEqual([]);
    });

    it('does not carry coverage carve-outs into sonar.exclusions', () => {
        // sonar.exclusions removes files from analysis entirely. A coverage
        // carve-out must never be laundered through it.
        const sonarExclusions = readSonarProperty('sonar.exclusions');

        expect(sonarExclusions).not.toContain(
            'ClientApp/src/components/reactaria_components/**',
        );
        expect(sonarExclusions.some((entry) => entry.endsWith('types.ts'))).toBe(
            false,
        );
    });

    it('keeps the analysed sources aligned with the measured sources', () => {
        const sources = readSonarProperty('sonar.sources');

        expect(sources).toEqual(['ClientApp/src', 'webpack.config.js']);
        expect(unitConfig.test?.coverage?.include).toEqual([
            'ClientApp/src/**/*.{ts,tsx}',
            'webpack.config.js',
        ]);
    });
});
