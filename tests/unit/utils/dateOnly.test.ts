import { describe, expect, it } from 'vitest';

import {
  dateOnlyToApiDate,
  dateOnlyToPickerDate,
  dateOnlyToStoredDateTimeString,
  formatDateOnlyForDisplay,
  parseApiDateOnlyInput,
  parseDateOnlyInput,
  parseDateOnlyValue,
} from '../../../ClientApp/src/utils/dateOnly';

describe('date-only utilities', () => {
  it('validates strict date-only strings', () => {
    expect.assertions(3);
    expect(parseDateOnlyValue('2026-06-11')).toBe('2026-06-11');
    expect(parseDateOnlyValue('2026-02-29')).toBeUndefined();
    expect(parseDateOnlyValue('11/06/2026')).toBeUndefined();
  });
});

describe('date-only utilities', () => {
  it('extracts calendar dates without applying timezone offsets', () => {
    expect.assertions(1);
    expect(parseDateOnlyInput(null)).toBeUndefined();
  });
});

describe('date-only utilities', () => {
  it('extracts calendar dates without applying timezone offsets', () => {
    expect.assertions(1);
    expect(parseDateOnlyInput(undefined)).toBeUndefined();
  });
});
