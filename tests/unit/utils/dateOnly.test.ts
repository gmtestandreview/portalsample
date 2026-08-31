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
        expect(parseDateOnlyValue('2026-06-11')).toBe('2026-06-11');
        expect(parseDateOnlyValue('2026-02-29')).toBeUndefined();
        expect(parseDateOnlyValue('11/06/2026')).toBeUndefined();
    });

    it('extracts calendar dates without applying timezone offsets', () => {
        expect(parseDateOnlyInput(null)).toBeUndefined();
        expect(parseDateOnlyInput(undefined)).toBeUndefined();
        expect(parseDateOnlyInput(new Date(Number.NaN))).toBeUndefined();
        expect(parseDateOnlyInput('2026-06-11')).toBe('2026-06-11');
        expect(parseDateOnlyInput('2026-06-11T00:00:00+10:00')).toBe('2026-06-11');
        expect(parseDateOnlyInput('2026-06-11T00:00:00-07:00')).toBe('2026-06-11');
        expect(parseDateOnlyInput('11/06/2026')).toBe('2026-06-11');
        expect(parseDateOnlyInput('not a date')).toBeUndefined();
    });

    it('serializes picker and API dates from the same calendar value', () => {
        const dateOnlyValue = parseDateOnlyValue('2026-06-11');

        expect(dateOnlyValue).toBeDefined();
        expect(dateOnlyToStoredDateTimeString(dateOnlyValue!)).toBe('2026-06-11T00:00:00+00:00');
        expect(dateOnlyToApiDate(dateOnlyValue!).toISOString()).toBe('2026-06-11T00:00:00.000Z');
        expect(parseDateOnlyInput(dateOnlyToPickerDate(dateOnlyValue!))).toBe('2026-06-11');
    });

    it('reads API Date objects by UTC calendar components', () => {
        expect(parseApiDateOnlyInput(new Date('2026-06-12T00:00:00.000Z'))).toBe('2026-06-12');
        expect(parseApiDateOnlyInput(new Date(Number.NaN))).toBeUndefined();
        expect(parseApiDateOnlyInput(undefined)).toBeUndefined();
    });

    it('formats display text from the calendar date rather than the host timezone instant', () => {
        const dateOnlyValue = parseDateOnlyInput('2026-06-11T00:00:00+10:00');

        expect(dateOnlyValue).toBeDefined();
        expect(formatDateOnlyForDisplay(dateOnlyValue!)).toBe('11 Jun 2026');
    });
});
