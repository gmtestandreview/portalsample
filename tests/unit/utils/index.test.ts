import { afterEach, describe, expect, it, vi } from 'vitest';
import * as utils from '../../../ClientApp/src/utils';

describe('utils exports', () => {
    it('exports each runtime utility function', () => {
        expect(typeof utils.sleep).toBe('function');
        expect(typeof utils.removeAllWhitespaces).toBe('function');
        expect(typeof utils.containsWhitespace).toBe('function');
        expect(typeof utils.removeEmptyKeys).toBe('function');
        expect(typeof utils.tail).toBe('function');
        expect(typeof utils.head).toBe('function');
        expect(typeof utils.propertyOf).toBe('function');
        expect(typeof utils.prefixedPropertyOf).toBe('function');
        expect(typeof utils.nullOrUndefinedToEmpty).toBe('function');
        expect(typeof utils.parseDate).toBe('function');
        expect(typeof utils.parseDateUTC).toBe('function');
        expect(typeof utils.isDateValid).toBe('function');
        expect(typeof utils.formatDateToUTC).toBe('function');
        expect(typeof utils.formatDateStringToUTC).toBe('function');
        expect(typeof utils.formatBytes).toBe('function');
        expect(typeof utils.formatDate).toBe('function');
        expect(typeof utils.formatDateToString).toBe('function');
        expect(typeof utils.formatReportingPeriod).toBe('function');
        expect(typeof utils.splitPascalCase).toBe('function');
        expect(typeof utils.base64toBlob).toBe('function');
        expect(typeof utils.formatCurrencyAmount).toBe('function');
    });
});

describe('string helpers', () => {
    it('removes spaces, tabs, and newlines from a string', () => {
        expect(utils.removeAllWhitespaces(' A b\tc \n d ')).toBe('Abcd');
    });

    it('detects whitespace in strings', () => {
        expect(utils.containsWhitespace('has space')).toBe(true);
        expect(utils.containsWhitespace('nospace')).toBe(false);
    });
});

describe('object and array helpers', () => {
    it('removes null, undefined, empty, and trimmed-empty values recursively', () => {
        const result = utils.removeEmptyKeys({
            keep: 'value',
            blank: '',
            whitespace: '   ',
            nil: null,
            missing: undefined,
            nested: {
                keep: 'nested',
                blank: '',
            },
            list: [
                {
                    keep: 'array',
                    blank: '',
                },
                'value',
                null,
            ],
        });

        expect(result).toEqual({
            keep: 'value',
            nested: {
                keep: 'nested',
            },
            list: [
                {
                    keep: 'array',
                },
                'value',
                null,
            ],
        });
    });

    it('applies the optional key-value filter after empty values are removed', () => {
        const result = utils.removeEmptyKeys(
            {
                keep: 'value',
                removeByFilter: 'value',
                removeEmptyBeforeFilter: '',
            },
            ([key]) => key !== 'removeByFilter',
        );

        expect(result).toEqual({ keep: 'value' });
    });

    it('returns the head item and tail portion of an array', () => {
        expect(utils.tail([1, 2, 3])).toEqual([2, 3]);
        expect(utils.head([1, 2, 3])).toBe(1);
        expect(utils.tail([])).toEqual([]);
        expect(utils.head([])).toBeUndefined();
    });

    it('returns typed property names and prefixed property names', () => {
        type Example = {
            child: string;
        };

        expect(utils.propertyOf<Example>('child')).toBe('child');
        expect(utils.prefixedPropertyOf<Example>('parent')('child')).toBe('parent.child');
    });

    it('converts null and undefined properties to empty strings recursively', () => {
        const result = utils.nullOrUndefinedToEmpty({
            keep: 'value',
            nil: null,
            missing: undefined,
            nested: {
                nil: null,
                keep: 'nested',
            },
            list: [
                {
                    missing: undefined,
                },
                null,
                'value',
            ],
        });

        expect(result).toEqual({
            keep: 'value',
            nil: '',
            missing: '',
            nested: {
                nil: '',
                keep: 'nested',
            },
            list: [
                {
                    missing: '',
                },
                null,
                'value',
            ],
        });
    });
});

describe('date helpers', () => {
    it('parses dd/MM/yyyy strings and normalizes time to local midnight', () => {
        const parsed = utils.parseDate('10/05/2024');

        expect(parsed).toBeInstanceOf(Date);
        expect(parsed?.getFullYear()).toBe(2024);
        expect(parsed?.getMonth()).toBe(4);
        expect(parsed?.getDate()).toBe(10);
        expect(parsed?.getHours()).toBe(0);
        expect(parsed?.getMinutes()).toBe(0);
        expect(parsed?.getSeconds()).toBe(0);
        expect(parsed?.getMilliseconds()).toBe(0);
    });

    it('parses ISO-like local date-time strings and Date objects', () => {
        const parsedString = utils.parseDate('2024-05-10T15:30:45+10:00');
        const parsedDate = utils.parseDate(new Date(2024, 4, 10, 15, 30, 45, 250));

        expect(parsedString?.getFullYear()).toBe(2024);
        expect(parsedString?.getMonth()).toBe(4);
        expect(parsedString?.getDate()).toBe(10);
        expect(parsedString?.getHours()).toBe(0);
        expect(parsedDate?.getHours()).toBe(0);
        expect(parsedDate?.getMilliseconds()).toBe(0);
    });

    it('returns undefined for invalid parsed dates', () => {
        expect(utils.parseDate('not-a-date')).toBeUndefined();
        expect(utils.parseDateUTC('not-a-date')).toBeUndefined();
        expect(utils.parseDateUTC(0 as unknown as Date)).toBeUndefined();
    });

    it('parses UTC-format date-time values and normalizes time to local midnight', () => {
        const parsedString = utils.parseDateUTC('2024-05-10T15:30:45+10:00');
        const parsedDate = utils.parseDateUTC(new Date(2024, 4, 10, 15, 30, 45, 250));

        expect(parsedString?.getFullYear()).toBe(2024);
        expect(parsedString?.getMonth()).toBe(4);
        expect(parsedString?.getDate()).toBe(10);
        expect(parsedString?.getHours()).toBe(0);
        expect(parsedDate?.getHours()).toBe(0);
        expect(parsedDate?.getMilliseconds()).toBe(0);
    });

    it('parses date-time values without normalizing the time portion', () => {
        const parsedShortDate = utils.parseDateWithTime('10/05/2024');
        const dateValue = new Date(2024, 4, 10, 15, 30, 45, 250);
        const parsedDate = utils.parseDateWithTime(dateValue);

        expect(parsedShortDate?.getFullYear()).toBe(2024);
        expect(parsedShortDate?.getMonth()).toBe(4);
        expect(parsedShortDate?.getDate()).toBe(10);
        expect(parsedDate).toBe(dateValue);
        expect(parsedDate?.getHours()).toBe(15);
        expect(parsedDate?.getMinutes()).toBe(30);
        expect(utils.parseDateWithTime('not-a-date')).toBeUndefined();
    });

    it('validates non-empty dates only', () => {
        expect(utils.isDateValid(null)).toBe(false);
        expect(utils.isDateValid(undefined)).toBe(false);
        expect(utils.isDateValid('   ')).toBe(false);
        expect(utils.isDateValid('not-a-date')).toBe(false);
        expect(utils.isDateValid('10/05/2024')).toBe(true);
        expect(utils.isDateValid(new Date(2024, 4, 10))).toBe(true);
    });

    it('formats valid dates to local offset date-time strings or null for invalid input', () => {
        expect(utils.formatDateToUTC(null)).toBeNull();
        expect(utils.formatDateToUTC('not-a-date')).toBeNull();
        expect(utils.formatDateToUTC(0 as unknown as Date)).toBeNull();
        expect(utils.formatDateToUTC('10/05/2024')).toMatch(/^2024-05-10T00:00:00[+-]\d{2}:\d{2}$/);
    });

    it('formats date strings as UTC Date objects and returns undefined for empty input', () => {
        const localDate = new Date(2024, 4, 10);

        expect(utils.formatDateStringToUTC()).toBeUndefined();
        expect(utils.formatDateStringToUTC(localDate)?.toISOString()).toBe('2024-05-10T00:00:00.000Z');
    });

    it('formats Date objects with default and custom date-fns patterns', () => {
        const date = new Date(2024, 4, 10);

        expect(utils.formatDate(null)).toBe('');
        expect(utils.formatDate(undefined)).toBe('');
        expect(utils.formatDate(date)).toBe('10 May 2024');
        expect(utils.formatDate(date, 'yyyy/MM/dd')).toBe('2024/05/10');
    });

    it('formats dates to strings or null for null, undefined, and invalid values', () => {
        const date = new Date(2024, 4, 10);

        expect(utils.formatDateToString(null)).toBeNull();
        expect(utils.formatDateToString(undefined)).toBeNull();
        expect(utils.formatDateToString('not-a-date')).toBeNull();
        expect(utils.formatDateToString(0 as unknown as Date)).toBeNull();
        expect(utils.formatDateToString('10/05/2024')).toBe('10 May 2024');
        expect(utils.formatDateToString('10/05/2024', 'yyyy/MM/dd')).toBe('2024/05/10');
        expect(utils.formatDateToString(date)).toBe('10 May 2024');
    });

    it('formats date-time values with time or returns null for invalid input', () => {
        const date = new Date(2024, 4, 10, 15, 30);

        expect(utils.formatDateTimeToString(null)).toBeNull();
        expect(utils.formatDateTimeToString(undefined)).toBeNull();
        expect(utils.formatDateTimeToString('not-a-date')).toBeNull();
        expect(utils.formatDateTimeToString(0 as unknown as Date)).toBeNull();

        // The parse format carries an offset token (`xxx`), so an offset-bearing string resolves to
        // an absolute instant and is then rendered in the runner's local zone. Asserting a literal
        // "3:30 PM" therefore only holds in Australian zones - it read 5:30 AM on the UTC CI runner.
        // Asserting that the string and Date paths agree on the same instant pins the behaviour that
        // actually matters (the offset is honoured, not discarded) in every zone.
        const sameInstant = new Date(Date.UTC(2024, 4, 10, 5, 30));
        expect(utils.formatDateTimeToString('2024-05-10T15:30:00+10:00'))
            .toBe(utils.formatDateTimeToString(sameInstant));

        // Local components in, local components out - no zone conversion, so this one is literal.
        expect(utils.formatDateTimeToString(date, 'yyyy/MM/dd HH:mm')).toBe('2024/05/10 15:30');
    });
});

describe('formatting helpers', () => {
    it('formats bytes with zero, default decimals, and negative decimal inputs', () => {
        expect(utils.formatBytes(0)).toBe('0 Bytes');
        expect(utils.formatBytes(1024)).toBe('1 kb');
        expect(utils.formatBytes(1536)).toBe('1.5 kb');
        expect(utils.formatBytes(1536, -1)).toBe('2 kb');
    });

    it('formats calendar and financial reporting periods', () => {
        expect(utils.formatReportingPeriod('CY 2024')).toBe('2024');
        expect(utils.formatReportingPeriod('FY 2021-2022')).toBe('2021-22');
    });

    it('splits PascalCase words using lower, sentence, and upper/default casing', () => {
        expect(utils.splitPascalCase('MeasurementReportStatus', 'lower')).toBe('measurement report status');
        expect(utils.splitPascalCase('MeasurementReportStatus', 'sentence')).toBe('Measurement report status');
        expect(utils.splitPascalCase('MeasurementReportStatus', 'upper')).toBe('Measurement Report Status');
        expect(utils.splitPascalCase('lowercase', 'lower')).toBe('lowercase');
        expect(utils.splitPascalCase('lowercase', 'sentence')).toBe('lowercase');
        expect(utils.splitPascalCase('lowercase', 'upper')).toBe('lowercase');
    });

    it('converts base64 data to a Blob with the requested type and slice size', async () => {
        const blob = utils.base64toBlob(btoa('hello world'), 'text/plain', 4);

        expect(blob.type).toBe('text/plain');
        expect(blob.size).toBe(11);
        await expect(blob.text()).resolves.toBe('hello world');
    });

    it('uses the default base64 Blob slice size when none is provided', async () => {
        const blob = utils.base64toBlob(btoa('default slice'), 'text/plain');

        expect(blob.type).toBe('text/plain');
        expect(blob.size).toBe(13);
        await expect(blob.text()).resolves.toBe('default slice');
    });

    it('substitutes 0 when codePointAt returns undefined for a code unit', async () => {
        const spy = vi.spyOn(String.prototype, 'codePointAt').mockReturnValueOnce(undefined);
        const blob = utils.base64toBlob(btoa('x'), 'text/plain', 512);
        spy.mockRestore();

        expect(blob.type).toBe('text/plain');
        expect(blob.size).toBe(1);
    });

    it('formats currency amounts and returns null for absent values', () => {
        expect(utils.formatCurrencyAmount(undefined)).toBeNull();
        expect(utils.formatCurrencyAmount(null as unknown as number)).toBeNull();
        expect(utils.formatCurrencyAmount(1234.5)).toBe('$1,234.50');
    });
});

describe('async helpers', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves sleep after the requested delay', async () => {
        vi.useFakeTimers();
        const resolved = vi.fn();

        const promise = utils.sleep(25).then(resolved);
        await vi.advanceTimersByTimeAsync(24);
        expect(resolved).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        await promise;

        expect(resolved).toHaveBeenCalledTimes(1);
    });
});
