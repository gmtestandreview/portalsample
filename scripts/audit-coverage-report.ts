/**
 * Audits an emitted V8 coverage report (coverage-final.json).
 *
 * The coverage *policy* lives in a config object, but Vitest 4 resolves
 * coverage from the root config only, so a project-level policy is inert on
 * some run paths. Asserting the config literal therefore proves nothing.
 * This auditor asserts the artifact the run actually produced.
 *
 * Usage: node scripts/audit-coverage-report.ts <coverage-final.json> <min-entries>
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export type CoverageReportAudit = {
    nonExecutableEntries: string[];
    executableEntryCount: number;
    verdict: 'clean' | 'dirty';
};

const EXECUTABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

const withoutQuery = (id: string): string => id.split('?')[0];

const isExecutable = (id: string): boolean =>
    EXECUTABLE_EXTENSIONS.some((extension) => withoutQuery(id).endsWith(extension));

export const auditCoverageReport = (
    report: Record<string, unknown>,
    minimumExecutableEntries: number,
): CoverageReportAudit => {
    const ids = Object.keys(report);
    const nonExecutableEntries = ids.filter((id) => !isExecutable(id));
    const executableEntryCount = ids.length - nonExecutableEntries.length;

    const verdict =
        nonExecutableEntries.length === 0 && executableEntryCount >= minimumExecutableEntries
            ? 'clean'
            : 'dirty';

    return { nonExecutableEntries, executableEntryCount, verdict };
};

/**
 * Only act as a CLI when this module *is* the entry point. Gating on
 * `process.argv[2]` alone would fire inside a Vitest worker, whose argv carries
 * the runner's own arguments, and parse an arbitrary path at import time.
 */
const isEntryPoint = (): boolean => {
    const entry = process.argv[1];

    return entry !== undefined && pathToFileURL(entry).href === import.meta.url;
};

if (isEntryPoint()) {
    const [, , reportPath, minimum] = process.argv;

    if (reportPath === undefined) {
        process.stdout.write(
            'usage: node scripts/audit-coverage-report.ts <coverage-final.json> <min-entries>\n',
        );
        process.exitCode = 2;
    } else {
        const report = JSON.parse(readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
        const audit = auditCoverageReport(report, Number(minimum ?? 1));

        process.stdout.write(
            `${audit.verdict.toUpperCase()}  ${reportPath}\n` +
                `  executable entries: ${audit.executableEntryCount}\n` +
                audit.nonExecutableEntries.map((id) => `  non-executable: ${id}\n`).join(''),
        );
        process.exitCode = audit.verdict === 'clean' ? 0 : 1;
    }
}
