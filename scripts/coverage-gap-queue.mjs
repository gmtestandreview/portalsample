/**
 * Generate Task A3's coverage gap queue from an Istanbul coverage report.
 *
 * The umbrella plan (Task A3, Step 2) requires each queue record to carry the
 * repository-relative source path, uncovered branch locations, uncovered
 * function names, uncovered lines, current percentages, owning source family,
 * and intended test file - sorted by uncovered branch count, then uncovered
 * function count, then uncovered line count.
 *
 * The previous queue was hand-made from coverage-summary.json and carried only
 * counts, so it could rank work but not start it. This reads coverage-final.json,
 * which retains the statement, function, and branch maps, and emits locations an
 * implementer can open directly.
 *
 * Usage: node scripts/coverage-gap-queue.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const COVERAGE_FINAL = 'reports/coverage/unit/coverage-final.json';
const OUTPUT = 'reports/stabilisation/coverage-gap-queue.json';
const SOURCE_ROOT = 'ClientApp/src/';

/**
 * Owning source families, in the priority order the plan validated. The first
 * matching pattern wins, so the more specific families are listed first.
 */
const FAMILIES = [
    {
        id: 2,
        name: 'Type Approval routes and guards',
        matches: (f) => /^routes\/ta\//.test(f) || /^routes\/dashboard\/dashboard-ta/.test(f),
    },
    {
        id: 3,
        name: 'Attachment and progress controls',
        matches: (f) => /^components\/Inputs\/Attachment\//.test(f) || /progress/i.test(f),
    },
    {
        id: 5,
        name: 'Slate editor',
        matches: (f) => /^components\/SlateEditor\//.test(f),
    },
    {
        id: 4,
        name: 'Request-list items and workflow pages',
        matches: (f) => /^routes\//.test(f) || /^components\/(RequestList|forms)\//.test(f),
    },
    {
        id: 6,
        name: 'Storage, validation, analytics, and bootstrap/config leftovers',
        matches: () => true,
    },
];

const familyOf = (relativeFile) =>
    FAMILIES.find((family) => family.matches(relativeFile));

/** Mirror ClientApp/src/x/y.tsx to tests/unit/x/y.test.tsx. */
const intendedTestFile = (relativeFile) => {
    const withoutExtension = relativeFile.replace(/\.(tsx|ts)$/, '');
    const extension = relativeFile.endsWith('.tsx') ? '.test.tsx' : '.test.ts';

    return `tests/unit/${withoutExtension}${extension}`;
};

const toRelative = (absolutePath) => {
    const normalised = absolutePath.replace(/\\/g, '/');
    const index = normalised.indexOf(SOURCE_ROOT);

    return index === -1
        ? normalised
        : normalised.slice(index + SOURCE_ROOT.length);
};

const percentage = (covered, total) =>
    total === 0 ? 100 : Number(((covered / total) * 100).toFixed(2));

const buildRow = (absolutePath, entry) => {
    const relativeFile = toRelative(absolutePath);

    const uncoveredLines = Object.entries(entry.s ?? {})
        .filter(([, hits]) => hits === 0)
        .map(([id]) => entry.statementMap[id]?.start?.line)
        .filter((line) => line !== undefined);

    const uncoveredFunctions = Object.entries(entry.f ?? {})
        .filter(([, hits]) => hits === 0)
        .map(([id]) => ({
            name: entry.fnMap[id]?.name ?? '(anonymous)',
            line: entry.fnMap[id]?.decl?.start?.line,
        }));

    const uncoveredBranches = [];
    for (const [id, hitCounts] of Object.entries(entry.b ?? {})) {
        const meta = entry.branchMap[id];
        hitCounts.forEach((hits, armIndex) => {
            if (hits !== 0) return;
            uncoveredBranches.push({
                type: meta?.type ?? 'unknown',
                line: meta?.loc?.start?.line ?? meta?.line,
                arm: armIndex,
            });
        });
    }

    const statementTotal = Object.keys(entry.s ?? {}).length;
    const functionTotal = Object.keys(entry.f ?? {}).length;
    const branchTotal = Object.values(entry.b ?? {}).reduce(
        (sum, arms) => sum + arms.length,
        0,
    );

    const family = familyOf(relativeFile);

    return {
        file: relativeFile,
        family: family.id,
        familyName: family.name,
        intendedTestFile: intendedTestFile(relativeFile),
        uncoveredBranches: uncoveredBranches.length,
        uncoveredFunctions: uncoveredFunctions.length,
        uncoveredStatements: uncoveredLines.length,
        statementsPct: percentage(statementTotal - uncoveredLines.length, statementTotal),
        branchesPct: percentage(branchTotal - uncoveredBranches.length, branchTotal),
        functionsPct: percentage(functionTotal - uncoveredFunctions.length, functionTotal),
        uncoveredLines,
        uncoveredFunctionNames: uncoveredFunctions,
        uncoveredBranchLocations: uncoveredBranches,
    };
};

const coverage = JSON.parse(readFileSync(COVERAGE_FINAL, 'utf8'));

const rows = Object.entries(coverage)
    .map(([absolutePath, entry]) => buildRow(absolutePath, entry))
    .filter(
        (row) =>
            row.uncoveredBranches > 0 ||
            row.uncoveredFunctions > 0 ||
            row.uncoveredStatements > 0,
    )
    .sort(
        (a, b) =>
            b.uncoveredBranches - a.uncoveredBranches ||
            b.uncoveredFunctions - a.uncoveredFunctions ||
            b.uncoveredStatements - a.uncoveredStatements,
    );

const totals = rows.reduce(
    (accumulator, row) => ({
        branches: accumulator.branches + row.uncoveredBranches,
        functions: accumulator.functions + row.uncoveredFunctions,
        statements: accumulator.statements + row.uncoveredStatements,
    }),
    { branches: 0, functions: 0, statements: 0 },
);

const byFamily = {};
for (const row of rows) {
    byFamily[row.family] ??= { name: row.familyName, files: 0, branches: 0, functions: 0, statements: 0 };
    byFamily[row.family].files += 1;
    byFamily[row.family].branches += row.uncoveredBranches;
    byFamily[row.family].functions += row.uncoveredFunctions;
    byFamily[row.family].statements += row.uncoveredStatements;
}

mkdirSync(path.dirname(OUTPUT), { recursive: true });
writeFileSync(
    OUTPUT,
    `${JSON.stringify({ generatedFrom: COVERAGE_FINAL, measuredFiles: Object.keys(coverage).length, filesNeedingWork: rows.length, totals, byFamily, rows }, null, 2)}\n`,
);

console.warn(`Measured files:      ${Object.keys(coverage).length}`);
console.warn(`Files needing work:  ${rows.length}`);
console.warn(`Uncovered branches:  ${totals.branches}`);
console.warn(`Uncovered functions: ${totals.functions}`);
console.warn(`Uncovered statements:${totals.statements}`);
console.warn('\nBy family:');
for (const [id, family] of Object.entries(byFamily).sort()) {
    console.warn(
        `  ${id}. ${family.name.padEnd(62)} ${String(family.files).padStart(3)} files  ${String(family.branches).padStart(5)}b ${String(family.functions).padStart(4)}f ${String(family.statements).padStart(5)}s`,
    );
}
console.warn(`\nWrote ${OUTPUT}`);
