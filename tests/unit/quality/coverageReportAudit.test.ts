import { describe, expect, it } from 'vitest';

import { auditCoverageReport } from '../../../scripts/audit-coverage-report';

const entry = (path: string): [string, { path: string }] => [path, { path }];

const repositoryRoot = 'C:/repo';

const cleanReport = Object.fromEntries([
  entry('C:/repo/ClientApp/src/components/Footer/index.tsx'),
  entry('C:/repo/ClientApp/src/utils/index.ts'),
  entry('C:/repo/ClientApp/src/env.ts'),
]);

describe('storybook coverage report audit', () => {
  it('passes a report containing only executable application source', () => {
    expect.assertions(3);
    const audit = auditCoverageReport(cleanReport, 3, repositoryRoot);

    expect(audit.nonExecutableEntries).toEqual([]);
    expect(audit.executableEntryCount).toBe(3);
    expect(audit.verdict).toBe('clean');
  });
});

describe('storybook coverage report audit', () => {
  it('names any non-executable asset that reached the remapper', () => {
    expect.assertions(2);
    const report = Object.fromEntries([
      ...Object.entries(cleanReport),
      entry('C:/repo/ClientApp/src/terms-config.json?import'),
    ]);

    const audit = auditCoverageReport(report, 3, repositoryRoot);

    expect(audit.nonExecutableEntries).toEqual([
      'C:/repo/ClientApp/src/terms-config.json?import',
    ]);
    expect(audit.verdict).toBe('dirty');
  });
});
