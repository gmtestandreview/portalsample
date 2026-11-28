import { describe, expect, it } from 'vitest';
import { toSummaryText } from '@/components/Inputs/DatePicker/dateFieldValue';

describe('date field summary text', () => {
  it('formats a stored date for display', () => {
    expect.hasAssertions();

    expect(toSummaryText('2026-03-05')).toBe('05 Mar 2026');
  });

  it('keeps text that is not a date as typed', () => {
    expect.hasAssertions();

    expect(toSummaryText('not a date')).toBe('not a date');
  });

  it.each([null, undefined])('is empty for %s', (value) => {
    expect.hasAssertions();

    expect(toSummaryText(value)).toBe('');
  });
});
