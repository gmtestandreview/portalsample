/**
 * Audits a captured Storybook/Vitest run log.
 *
 * A string scan over a log is only evidence if the run reached the phase that
 * emits the string. V8 coverage remapping and the Vitest summary are both
 * end-of-run phases; a log truncated by an OOM or a kill contains zero
 * occurrences of every target string while proving nothing. This auditor
 * reports `invalid` rather than `clean` in that case.
 *
 * A positive hit is still valid evidence in a truncated log, so hits win.
 *
 * Usage: node scripts/audit-storybook-log.ts <path-to-log>
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export type TargetHit = { target: string; count: number };

export type LogAudit = {
    completed: boolean;
    truncatedBy: string[];
    hits: TargetHit[];
    verdict: 'clean' | 'dirty' | 'invalid';
};

export const TARGET_STRINGS: readonly string[] = [
    'DEPRECATED',
    'vitest.init',
    '[MSW] Warning',
    'unhandled request',
    'Failed to parse',
    'RolldownError',
    'PARSE_ERROR',
    'unknown test',
];

const TRUNCATION_MARKERS: readonly string[] = [
    'JavaScript heap out of memory',
    'Ineffective mark-compacts near heap limit',
    'FATAL ERROR',
];

const COMPLETION_MARKER = /^\s*Test Files\s+\d/m;

export const auditLog = (log: string): LogAudit => {
    const completed = COMPLETION_MARKER.test(log);
    const truncatedBy = TRUNCATION_MARKERS.filter((marker) => log.includes(marker));
    const hits = TARGET_STRINGS
        .map((target) => ({ target, count: log.split(target).length - 1 }))
        .filter(({ count }) => count > 0);

    const verdict = hits.length > 0 ? 'dirty' : completed && truncatedBy.length === 0 ? 'clean' : 'invalid';

    return { completed, truncatedBy, hits, verdict };
};

export const formatReport = (audit: LogAudit, source: string): string => {
    const lines = [`${audit.verdict.toUpperCase()}  ${source}`];

    if (!audit.completed) {
        lines.push('  no `Test Files` summary: the run did not reach its end-of-run phases,');
        lines.push('  so a zero-hit scan is not evidence that the diagnostics are gone.');
    }

    for (const marker of audit.truncatedBy) {
        lines.push(`  truncated by: ${marker}`);
    }

    for (const { target, count } of audit.hits) {
        lines.push(`  ${count} x ${target}`);
    }

    return lines.join('\n');
};

/**
 * Only act as a CLI when this module *is* the entry point. Gating on
 * `process.argv[2]` alone would fire inside a Vitest worker, whose argv carries
 * the runner's own arguments, and read an arbitrary path at import time.
 */
const isEntryPoint = (): boolean => {
    const entry = process.argv[1];

    return entry !== undefined && pathToFileURL(entry).href === import.meta.url;
};

if (isEntryPoint()) {
    const [, , logPath] = process.argv;

    if (logPath === undefined) {
        process.stdout.write('usage: node scripts/audit-storybook-log.ts <path-to-log>\n');
        process.exitCode = 2;
    } else {
        const audit = auditLog(readFileSync(logPath, 'utf8'));
        process.stdout.write(`${formatReport(audit, logPath)}\n`);
        process.exitCode = audit.verdict === 'clean' ? 0 : 1;
    }
}
