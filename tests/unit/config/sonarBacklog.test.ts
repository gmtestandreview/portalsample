import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const CHILD_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 45_000;

function runBacklog() {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), 'sonar-backlog-'));
    const outputPath = path.join(outputDirectory, 'sonar-issues-backlog.md');
    const result = spawnSync(
        process.execPath,
        [
            'scripts/sonar-issues-backlog.mjs',
            '--fixture',
            'tests/fixtures/sonar',
            '--out',
            outputPath,
        ],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            timeout: CHILD_TIMEOUT_MS,
        },
    );

    return {
        result,
        output: result.status === 0 ? readFileSync(outputPath, 'utf8') : '',
    };
}

describe('Sonar all-issue backlog pressure tests', () => {
    it(
        'RED: keeps every Sonar issue returned by every fixture page',
        () => {
            const { result, output } = runBacklog();

            expect(result.status, result.stderr).toBe(0);
            expect(output).toContain('SONAR-SECURITY-HIGH');
            expect(output).toContain('SONAR-BUG-MEDIUM');
            expect(output).toContain('SONAR-ACCEPTED-LOW');
            expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
            expect(output).toContain('SONAR-INFO-LOW');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'GREEN: prioritises security and reliability ahead of low maintainability work',
        () => {
            const { output } = runBacklog();

            expect(output.indexOf('SONAR-SECURITY-HIGH')).toBeLessThan(
                output.indexOf('SONAR-BUG-MEDIUM'),
            );
            expect(output.indexOf('SONAR-BUG-MEDIUM')).toBeLessThan(
                output.indexOf('SONAR-INFO-LOW'),
            );
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'AMBER: preserves unknown future Sonar shapes as triage work instead of dropping them',
        () => {
            const { result, output } = runBacklog();

            expect(result.stdout).toContain('AMBER');
            expect(output).toContain('Needs triage');
            expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'RED: never writes authentication material into the backlog artifact',
        () => {
            const { output } = runBacklog();

            expect(output).not.toContain('SONAR_TOKEN');
            expect(output).not.toContain('Bearer ');
        },
        TEST_TIMEOUT_MS,
    );
});
