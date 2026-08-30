import { describe, expect, it } from 'vitest';
import { auditLog, formatReport } from '../../../scripts/audit-storybook-log';

const completedRun = [
    'stdout | Some.stories.tsx > Default',
    ' Test Files  87 passed (87)',
    '      Tests  218 passed (218)',
    '   Duration  183.42s',
].join('\n');

const oomRun = [
    'stdout | Some.stories.tsx > Default',
    '<--- Last few GCs --->',
    'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory',
].join('\n');

describe('storybook run log audit', () => {
    it('reports clean only when the run reached its summary', () => {
        const audit = auditLog(completedRun);

        expect(audit.completed).toBe(true);
        expect(audit.hits).toEqual([]);
        expect(audit.verdict).toBe('clean');
    });

    it('refuses to call a truncated log clean, even with zero target strings', () => {
        // This is the exact shape of docs/change-record/storybbok_change_remaining_errors.md:
        // no target strings, and no summary either. Absence of evidence is not
        // evidence of absence, because V8 remapping runs at end of run.
        const audit = auditLog(oomRun);

        expect(audit.completed).toBe(false);
        expect(audit.hits).toEqual([]);
        expect(audit.verdict).toBe('invalid');
        expect(audit.truncatedBy).toContain('JavaScript heap out of memory');
    });

    it('still reports a positive hit found in a truncated log', () => {
        // Presence of evidence IS valid evidence, even when the run died early.
        const audit = auditLog(`${oomRun}\n[MSW] Warning: intercepted a request without a matching handler`);

        expect(audit.completed).toBe(false);
        expect(audit.verdict).toBe('dirty');
        expect(audit.hits).toEqual([{ target: '[MSW] Warning', count: 1 }]);
    });

    it('counts every occurrence of each target string', () => {
        const audit = auditLog(`${completedRun}\nunhandled request\nunhandled request`);

        expect(audit.verdict).toBe('dirty');
        expect(audit.hits).toEqual([{ target: 'unhandled request', count: 2 }]);
    });

    it('names the source and the reason in the report', () => {
        expect(formatReport(auditLog(oomRun), 'run.log')).toContain('run.log');
        expect(formatReport(auditLog(oomRun), 'run.log')).toContain('INVALID');
    });
});
