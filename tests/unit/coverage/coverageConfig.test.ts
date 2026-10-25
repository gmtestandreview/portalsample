import { describe, expect, it } from 'vitest';


import config from '../../../vitest.unit.config';


const coverageConfig = config.test?.coverage;


if (coverageConfig?.provider !== 'v8') {
    throw new Error('vitest.unit.config.ts must declare V8 unit coverage');
}

describe('unit coverage configuration', () => {
it('keeps coverage config under test so Vitest applies it', () => {
      expect.assertions(4);
        expect(coverageConfig).toBeDefined();
        expect(coverageConfig.provider).toBe('v8');
        // `json` emits coverage-final.json, which retains the statement,
        // function and branch maps. `json-summary` carries only per-file
        // totals, so Task A3's gap queue could rank work but not locate it.
        // Both are required; see scripts/coverage-gap-queue.mjs.
        // `lcov` is the only format SonarQube imports for TypeScript; dropping
        // it silently reports 0% coverage on SonarCloud, which reads as a real
        // regression rather than a missing file. See sonar-project.properties.
        expect(coverageConfig.reporter).toEqual([
            'text',
            'html',
            'json-summary',
            'json',
            'lcov',
        ]);
        expect(coverageConfig.reportsDirectory).toBe('./reports/coverage/unit');
    })
})

describe('unit coverage configuration', () => {
it('still writes coverage evidence when the run is red', () => {
      expect.assertions(1);
        // Vitest defaults reportOnFailure to false, which writes no report at
        // all when any test fails - and it cleans the output directory first, so
        // a red run leaves nothing behind. The PR workflow uploads
        // reports/coverage/unit/** with `if: always()` and
        // `if-no-files-found: error`, so the upload would fail with "no files
        // found" and mask the real failure. A red vitest-unit is the expected
        // state until Child Plan B1 lands, so this must stay true.
        expect(coverageConfig.reportOnFailure).toBe(true);
    })
})
