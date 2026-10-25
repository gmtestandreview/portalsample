import { describe, expect, it } from 'vitest';

import { parseMcpMarkdownReport } from '../../e2e/support/storybookMcpReport';

describe(parseMcpMarkdownReport, () => {
  it('extracts passing stories and empty failure sections', () => {
    expect.assertions(1);
    const report = parseMcpMarkdownReport(`
## Passing Stories

- components-searchfilter-searchbox--type-and-submit
- components-progress-progressfilelist--cancel-invokes-callback

## Failing Stories

## Accessibility Violations

## Unhandled Errors
`);

    expect(report).toEqual({
      passingStoryIds: [
        'components-searchfilter-searchbox--type-and-submit',
        'components-progress-progressfilelist--cancel-invokes-callback',
      ],
      failingStoryIds: [],
      accessibilityViolationStoryIds: [],
      unhandledErrors: [],
      missingSections: [],
    });
  });
});

describe(parseMcpMarkdownReport, () => {
  it('retains failed story and diagnostic entries', () => {
    expect.assertions(4);
    const report = parseMcpMarkdownReport(`
## Passing Stories

- components-searchfilter-searchbox--type-and-submit

## Failing Stories

- components-progress-progressfilelist--cancel-invokes-callback

## Accessibility Violations

- components-progress-progressfilelist--cancel-invokes-callback

## Unhandled Errors

- Vitest runner failed
`);

    expect(report.failingStoryIds).toEqual([
      'components-progress-progressfilelist--cancel-invokes-callback',
    ]);
    expect(report.accessibilityViolationStoryIds).toEqual([
      'components-progress-progressfilelist--cancel-invokes-callback',
    ]);
    expect(report.unhandledErrors).toEqual(['Vitest runner failed']);
    expect(report.missingSections).toEqual([]);
  });
});
