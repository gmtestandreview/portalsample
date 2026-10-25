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

const summaryThenOomRun = `${completedRun}\n${oomRun}`;

describe('storybook run log audit', () => {
  it('reports clean only when the run reached its summary', () => {
    expect.assertions(3);
    const audit = auditLog(completedRun);

    expect(audit.completed).toBe(true);
    expect(audit.hits).toEqual([]);
    expect(audit.verdict).toBe('clean');
  });
});
