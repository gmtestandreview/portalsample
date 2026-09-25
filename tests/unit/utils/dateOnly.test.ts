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

    it('pairs each Date convention with the parser that reads it back', () => {
        // The local/UTC asymmetry between parseDateOnlyInput and
        // parseApiDateOnlyInput is deliberate, not an oversight. Picker Dates
        // are built at LOCAL noon by dateOnlyToPickerDate, so local getters
        // round-trip them; API Dates are built at UTC midnight by
        // dateOnlyToApiDate, so UTC getters round-trip them. Reading either one
        // with the other parser shifts the stored calendar date by a day for
        // any host east or west of UTC.
        const dateOnlyValue = parseDateOnlyValue('2026-06-11');

        expect(dateOnlyValue).toBeDefined();
        expect(parseDateOnlyInput(dateOnlyToPickerDate(dateOnlyValue!))).toBe('2026-06-11');
        expect(parseApiDateOnlyInput(dateOnlyToApiDate(dateOnlyValue!))).toBe('2026-06-11');
    });

    it('reads the UTC calendar date for API input and the host calendar date for picker input', () => {
        // An instant late in the UTC day: east of UTC the local calendar date
        // has already rolled over, west of UTC it has not. Asserting the local
        // half against the Date's own getters keeps this true in every zone
        // while still pinning the API half to a fixed UTC answer.
        const instant = new Date('2026-06-11T23:00:00.000Z');
        const pad = (part: number) => String(part).padStart(2, '0');
        const hostCalendarDate =
            `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`;

        expect(parseApiDateOnlyInput(instant)).toBe('2026-06-11');
        expect(parseDateOnlyInput(instant)).toBe(hostCalendarDate);
    });

    it('formats display text from the calendar date rather than the host timezone instant', () => {
        const dateOnlyValue = parseDateOnlyInput('2026-06-11T00:00:00+10:00');

        expect(dateOnlyValue).toBeDefined();
        expect(formatDateOnlyForDisplay(dateOnlyValue!)).toBe('11 Jun 2026');
    });
});
