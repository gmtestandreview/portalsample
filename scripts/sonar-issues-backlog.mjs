#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_OUT = 'analysis/sonar-issues-backlog.md';
const PAGE_SIZE = 500;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_REQUEST_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const MARKDOWN_PIPE_ESCAPE = String.raw`\|`;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function positiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function rankIssue(issue) {
  const impactSeverity =
    issue.impactSeverity ?? issue.impactSeverities?.[0] ?? '';
  const legacySeverity = issue.severity ?? '';
  const quality =
    issue.impactSoftwareQuality ?? issue.impactSoftwareQualities?.[0] ?? '';
  const type = issue.type ?? '';

  if (quality === 'SECURITY' || type === 'VULNERABILITY') {
    return impactSeverity === 'HIGH' ||
      ['BLOCKER', 'CRITICAL'].includes(legacySeverity)
      ? 'P0'
      : 'P1';
  }
  if (quality === 'RELIABILITY' || type === 'BUG') {
    return impactSeverity === 'HIGH' ||
      ['BLOCKER', 'CRITICAL'].includes(legacySeverity)
      ? 'P1'
      : 'P2';
  }
  if (impactSeverity === 'HIGH' || legacySeverity === 'MAJOR') return 'P2';
  if (impactSeverity === 'MEDIUM' || legacySeverity === 'MINOR') return 'P3';
  if (impactSeverity === 'LOW' || legacySeverity === 'INFO') return 'P4';
  return 'Needs triage';
}

function issuePath(issue) {
  const component = issue.component ?? '';
  const colon = component.indexOf(':');
  return colon === -1 ? component : component.slice(colon + 1);
}

function normalizeIssue(issue) {
  return {
    key: issue.key,
    priority: rankIssue(issue),
    status: issue.issueStatus ?? issue.status ?? 'UNKNOWN',
    severity: issue.impactSeverity ?? issue.severity ?? 'UNKNOWN',
    quality: issue.impactSoftwareQuality ?? issue.type ?? 'UNKNOWN',
    rule: issue.rule ?? 'UNKNOWN_RULE',
    path: issuePath(issue),
    line: issue.line ?? 1,
    effort: issue.effort ?? '',
    message: issue.message ?? '',
    updated: issue.updateDate ?? '',
  };
}

function validateIssuePayload(payload, source) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.issues)
  ) {
    throw new Error(`${source} must contain an issues array.`);
  }

  payload.issues.forEach((issue, index) => {
    if (
      !issue ||
      typeof issue !== 'object' ||
      Array.isArray(issue) ||
      typeof issue.key !== 'string' ||
      issue.key.length === 0
    ) {
      throw new Error(
        `${source} contains invalid issue at index ${index}: expected an object with a non-empty key.`
      );
    }

    for (const field of [
      'component',
      'effort',
      'impactSeverity',
      'impactSoftwareQuality',
      'issueStatus',
      'message',
      'rule',
      'severity',
      'status',
      'type',
      'updateDate',
    ]) {
      if (field in issue && typeof issue[field] !== 'string') {
        throw new Error(
          `${source} contains invalid issue at index ${index}: ${field} must be a string.`
        );
      }
    }

    for (const field of ['impactSeverities', 'impactSoftwareQualities']) {
      if (
        field in issue &&
        (!Array.isArray(issue[field]) ||
          issue[field].some((value) => typeof value !== 'string'))
      ) {
        throw new Error(
          `${source} contains invalid issue at index ${index}: ${field} must be an array of strings.`
        );
      }
    }

    if ('line' in issue && (!Number.isInteger(issue.line) || issue.line < 1)) {
      throw new Error(
        `${source} contains invalid issue at index ${index}: line must be a positive integer.`
      );
    }
  });

  return payload.issues;
}

function validateUniqueIssueKeys(issues, source) {
  const issueKeys = new Set();
  for (const issue of issues) {
    if (issueKeys.has(issue.key)) {
      throw new Error(`${source} contains duplicate issue key ${issue.key}.`);
    }
    issueKeys.add(issue.key);
  }
}

function priorityWeight(priority) {
  return (
    {
      P0: 0,
      P1: 1,
      P2: 2,
      P3: 3,
      P4: 4,
      'Needs triage': 5,
    }[priority] ?? 6
  );
}

function formatMarkdown(issues) {
  const rows = issues
    .map(normalizeIssue)
    .sort(
      (a, b) =>
        priorityWeight(a.priority) - priorityWeight(b.priority) ||
        a.status.localeCompare(b.status) ||
        a.key.localeCompare(b.key)
    );

  const amberCount = rows.filter(
    (issue) => issue.priority === 'Needs triage'
  ).length;
  const lines = [
    '# Sonar Issues Backlog',
    '',
    '> Generated by `node scripts/sonar-issues-backlog.mjs`. Do not add secrets to this file.',
    '',
    `Total issues captured: ${rows.length}`,
    `Needs triage: ${amberCount}`,
    '',
    '| Priority | Key | Status | Severity | Quality | Rule | Location | Effort | Message |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const issue of rows) {
    lines.push(
      `| ${issue.priority} | ${issue.key} | ${issue.status} | ${issue.severity} | ${issue.quality} | ${issue.rule} | ${issue.path}:${issue.line} | ${issue.effort} | ${issue.message.replaceAll('|', MARKDOWN_PIPE_ESCAPE)} |`
    );
  }

  return `${lines.join('\n')}\n`;
}

function readFixtureIssues(fixtureDirectory) {
  const issues = readdirSync(fixtureDirectory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      const fixturePath = path.join(fixtureDirectory, file);
      let payload;
      try {
        payload = JSON.parse(readFileSync(fixturePath, 'utf8'));
      } catch (error) {
        throw new Error(
          `${fixturePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        );
      }
      return validateIssuePayload(payload, fixturePath);
    });
  validateUniqueIssueKeys(issues, fixtureDirectory);
  return issues;
}

async function fetchSonarPage(url, token) {
  const timeoutMs = positiveIntegerEnv(
    'SONAR_REQUEST_TIMEOUT_MS',
    DEFAULT_REQUEST_TIMEOUT_MS
  );
  const maxAttempts = positiveIntegerEnv(
    'SONAR_MAX_REQUEST_ATTEMPTS',
    DEFAULT_MAX_REQUEST_ATTEMPTS
  );
  const retryDelayMs = positiveIntegerEnv(
    'SONAR_RETRY_DELAY_MS',
    DEFAULT_RETRY_DELAY_MS
  );
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let responseBody;

    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      responseBody = await response.text();
    } catch (error) {
      lastError =
        error instanceof Error && error.name === 'AbortError'
          ? new Error(`Sonar API request timed out after ${timeoutMs}ms.`)
          : error instanceof Error
            ? error
            : new Error(String(error));
      clearTimeout(timeout);
      if (attempt === maxAttempts) throw lastError;
      await wait(retryDelayMs * 2 ** (attempt - 1));
      continue;
    }

    clearTimeout(timeout);
    if (!response.ok) {
      lastError = new Error(
        `Sonar API request failed ${response.status}: ${responseBody}`
      );
      if (!isRetryableStatus(response.status) || attempt === maxAttempts) {
        throw lastError;
      }
      await wait(retryDelayMs * 2 ** (attempt - 1));
      continue;
    }

    try {
      return JSON.parse(responseBody);
    } catch (error) {
      throw new Error(
        `Sonar API returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  throw lastError ?? new Error('Sonar API request failed without an error.');
}

async function fetchLiveIssues() {
  const host = process.env.SONAR_HOST_URL;
  const token = process.env.SONAR_TOKEN;
  const projectKey = process.env.SONAR_PROJECT_KEY;

  if (!(host && token && projectKey)) {
    throw new Error(
      'Set SONAR_HOST_URL, SONAR_TOKEN, and SONAR_PROJECT_KEY, or run with --fixture <dir>.'
    );
  }

  const issues = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (issues.length < total) {
    const url = new URL('/api/issues/search', host);
    url.searchParams.set('componentKeys', projectKey);
    url.searchParams.set('p', String(page));
    url.searchParams.set('ps', String(PAGE_SIZE));

    const payload = await fetchSonarPage(url, token);
    const pageIssues = validateIssuePayload(payload, `Sonar API page ${page}`);
    const nextTotal = payload.paging?.total ?? payload.total;

    if (!Number.isInteger(nextTotal) || nextTotal < 0) {
      throw new Error(
        `Sonar API page ${page} must include a non-negative integer total.`
      );
    }

    if (pageIssues.length === 0 && issues.length < nextTotal) {
      throw new Error(
        `Sonar API pagination made no progress on page ${page}: expected ${nextTotal} issue(s), received ${issues.length}.`
      );
    }

    issues.push(...pageIssues);
    total = nextTotal;
    page += 1;

    try {
      validateUniqueIssueKeys(issues, `Sonar API page ${page - 1}`);
    } catch (error) {
      throw new Error(
        `Sonar API pagination made no progress on page ${page - 1}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  return issues;
}

const fixtureDirectory = argValue('--fixture');
const outputPath = argValue('--out') ?? DEFAULT_OUT;
const issues = fixtureDirectory
  ? readFixtureIssues(fixtureDirectory)
  : await fetchLiveIssues();
const markdown = formatMarkdown(issues);
const outputDirectory = path.dirname(outputPath);

if (!existsSync(outputDirectory))
  mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputPath, markdown, 'utf8');

if (issues.some((issue) => rankIssue(issue) === 'Needs triage')) {
  process.stdout.write(
    'analysis/sonar-issues-backlog.md(1,1): warning SONAR-BACKLOG: [AMBER] backlog contains Sonar issues with unknown severity/quality fields; triage them manually.\n'
  );
}
process.stdout.write(
  `Captured ${issues.length} Sonar issue(s) in ${outputPath}.\n`
);
