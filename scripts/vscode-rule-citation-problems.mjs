#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const CHECKER = 'scripts/verify-rule-citations.mjs';
const ERROR_STATUSES = new Set(['MISCITED', 'PAST_EOF', 'MISSING_FILE']);
const WARNING_STATUSES = new Set(['UNRESOLVED', 'NO_LINE']);

function severityFor(status) {
    if (WARNING_STATUSES.has(status)) return 'warning';
    return ERROR_STATUSES.has(status) ? 'error' : 'warning';
}

function lineFor(result) {
    if (typeof result.cited === 'number' && result.cited > 0) return result.cited;
    if (result.derived && typeof result.derived.start === 'number') return result.derived.start;
    return 1;
}

function messageFor(result) {
    const detail = result.detail || 'rule citation needs attention';
    return `[${result.status}] ${detail}`;
}

export function formatProblem(result) {
    const file = result.path || 'analysis/BUSINESS_RULES.md';
    const line = lineFor(result);
    const severity = severityFor(result.status);
    const rule = result.rule || 'RULE-000';
    const message = messageFor(result);

    return `${file}(${line},1): ${severity} ${rule}: ${message}`;
}

const run = spawnSync(process.execPath, [CHECKER, '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
});

if (run.error) {
    console.error(
        `analysis/BUSINESS_RULES.md(1,1): error RULE-000: failed to run ${CHECKER}: ${run.error.message}`,
    );
    process.exit(1);
}

let payload;
try {
    payload = JSON.parse(run.stdout);
} catch (error) {
    console.error(
        `analysis/BUSINESS_RULES.md(1,1): error RULE-000: failed to parse ${CHECKER} --json output: ${error.message}`,
    );
    if (run.stdout.trim()) console.error(run.stdout.trim());
    if (run.stderr.trim()) console.error(run.stderr.trim());
    process.exit(1);
}

const problems = payload.results.filter((result) => result.status !== 'OK');
for (const problem of problems) {
    console.log(formatProblem(problem));
}

if (run.stderr.trim()) {
    console.error(run.stderr.trim());
}

process.exit(run.status ?? 0);
