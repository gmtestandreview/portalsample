import { describe, expect, it } from 'vitest';
import { parseMcpMarkdownReport } from '../../e2e/support/storybookMcpReport';

// function suite titles are required by vitest/prefer-describe-function-title.
describe(parseMcpMarkdownReport, () => {
  it('extracts passing stories and empty failure sections', () => {
    expect.hasAssertions();

    const report = parseMcpMarkdownReport(`
## Passing Stories

- components-searchfilter-searchbox--type-and-submit
- components-progress-progressfilelist--cancel-invokes-callback

## Failing Stories

## Accessibility Violations

## Unhandled Errors
`);

    expect(report).toStrictEqual({
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

  it('retains failed story and diagnostic entries', () => {
    expect.hasAssertions();

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

    expect(report.failingStoryIds).toStrictEqual([
      'components-progress-progressfilelist--cancel-invokes-callback',
    ]);
    expect(report.accessibilityViolationStoryIds).toStrictEqual([
      'components-progress-progressfilelist--cancel-invokes-callback',
    ]);
    expect(report.unhandledErrors).toStrictEqual(['Vitest runner failed']);
    expect(report.missingSections).toStrictEqual([]);
  });

  it('reports missing sections instead of treating them as empty', () => {
    expect.hasAssertions();

    const report = parseMcpMarkdownReport(`
## Passing Stories

- components-searchfilter-searchbox--type-and-submit
`);

    expect(report.missingSections).toStrictEqual([
      'Failing Stories',
      'Accessibility Violations',
      'Unhandled Errors',
    ]);
  });
});
