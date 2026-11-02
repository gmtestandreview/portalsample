import { describe, expect, it, vi } from 'vitest';
import * as utils from '../../../ClientApp/src/utils';

describe('utils exports', () => {
  it('exports each runtime utility function', () => {
    expect.hasAssertions();

    expect(
      [
        utils.sleep,
        utils.removeAllWhitespaces,
        utils.containsWhitespace,
        utils.removeEmptyKeys,
        utils.tail,
        utils.head,
        utils.propertyOf,
        utils.prefixedPropertyOf,
        utils.nullOrUndefinedToEmpty,
        utils.parseDate,
        utils.parseDateUTC,
        utils.isDateValid,
        utils.formatDateToUTC,
        utils.formatDateStringToUTC,
        utils.formatBytes,
        utils.formatDate,
        utils.formatDateToString,
        utils.formatReportingPeriod,
        utils.splitPascalCase,
        utils.base64toBlob,
        utils.formatCurrencyAmount,
      ].every((utility) => typeof utility === 'function'),
    ).toBe(true);
  });
});

describe('string helpers', () => {
  it('removes spaces, tabs, and newlines from a string', () => {
    expect.hasAssertions();

    expect(utils.removeAllWhitespaces(' A b\tc \n d ')).toBe('Abcd');
  });

  it('detects whitespace in strings', () => {
    expect.hasAssertions();

    expect(utils.containsWhitespace('has space')).toBe(true);
    expect(utils.containsWhitespace('nospace')).toBe(false);
  });
});

describe('object and array helpers', () => {
  it('removes null, undefined, empty, and trimmed-empty values recursively', () => {
    expect.hasAssertions();

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

    expect(result).toStrictEqual({
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
    expect.hasAssertions();

    const result = utils.removeEmptyKeys(
      {
        keep: 'value',
        removeByFilter: 'value',
        removeEmptyBeforeFilter: '',
      },
      ([key]) => key !== 'removeByFilter',
    );

    expect(result).toStrictEqual({ keep: 'value' });
  });

  it('returns the head item and tail portion of an array', () => {
    expect.hasAssertions();

    expect(utils.tail([1, 2, 3])).toStrictEqual([2, 3]);
    expect(utils.head([1, 2, 3])).toBe(1);
    expect(utils.tail([])).toStrictEqual([]);
    expect(utils.head([])).toBeUndefined();
  });

  it('returns typed property names and prefixed property names', () => {
    expect.hasAssertions();

    type Example = {
      child: string;
    };

    expect(utils.propertyOf<Example>('child')).toBe('child');
    expect(utils.prefixedPropertyOf<Example>('parent')('child')).toBe(
      'parent.child',
    );
  });

  it('converts null and undefined properties to empty strings recursively', () => {
    expect.hasAssertions();

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

    expect(result).toStrictEqual({
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
    expect.hasAssertions();

    const parsed = utils.parseDate('10/05/2024');

    expect({
      isDate: parsed instanceof Date,
      year: parsed?.getFullYear(),
      month: parsed?.getMonth(),
      date: parsed?.getDate(),
      hours: parsed?.getHours(),
      minutes: parsed?.getMinutes(),
      seconds: parsed?.getSeconds(),
      milliseconds: parsed?.getMilliseconds(),
    }).toStrictEqual({
      isDate: true,
      year: 2024,
      month: 4,
      date: 10,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
  });

  it('parses ISO-like local date-time strings and Date objects', () => {
    expect.hasAssertions();

    const parsedString = utils.parseDate('2024-05-10T15:30:45+10:00');
    const parsedDate = utils.parseDate(new Date(2024, 4, 10, 15, 30, 45, 250));

    expect({
      stringYear: parsedString?.getFullYear(),
      stringMonth: parsedString?.getMonth(),
      stringDate: parsedString?.getDate(),
      stringHours: parsedString?.getHours(),
      dateHours: parsedDate?.getHours(),
      dateMilliseconds: parsedDate?.getMilliseconds(),
    }).toStrictEqual({
      stringYear: 2024,
      stringMonth: 4,
      stringDate: 10,
      stringHours: 0,
      dateHours: 0,
      dateMilliseconds: 0,
    });
  });

  it('returns undefined for invalid parsed dates', () => {
    expect.hasAssertions();

    expect(utils.parseDate('not-a-date')).toBeUndefined();
    expect(utils.parseDateUTC('not-a-date')).toBeUndefined();
    expect(utils.parseDateUTC(0 as unknown as Date)).toBeUndefined();
  });

  it('parses UTC-format date-time values and normalizes time to local midnight', () => {
    expect.hasAssertions();

    const parsedString = utils.parseDateUTC('2024-05-10T15:30:45+10:00');
    const parsedDate = utils.parseDateUTC(
      new Date(2024, 4, 10, 15, 30, 45, 250),
    );

    expect({
      stringYear: parsedString?.getFullYear(),
      stringMonth: parsedString?.getMonth(),
      stringDate: parsedString?.getDate(),
      stringHours: parsedString?.getHours(),
      dateHours: parsedDate?.getHours(),
      dateMilliseconds: parsedDate?.getMilliseconds(),
    }).toStrictEqual({
      stringYear: 2024,
      stringMonth: 4,
      stringDate: 10,
      stringHours: 0,
      dateHours: 0,
      dateMilliseconds: 0,
    });
  });

  it('parses date-time values without normalizing the time portion', () => {
    expect.hasAssertions();

    const parsedShortDate = utils.parseDateWithTime('10/05/2024');
    const dateValue = new Date(2024, 4, 10, 15, 30, 45, 250);
    const parsedDate = utils.parseDateWithTime(dateValue);

    expect({
      year: parsedShortDate?.getFullYear(),
      month: parsedShortDate?.getMonth(),
      date: parsedShortDate?.getDate(),
      sameDate: parsedDate === dateValue,
      hours: parsedDate?.getHours(),
      minutes: parsedDate?.getMinutes(),
      invalid: utils.parseDateWithTime('not-a-date'),
    }).toStrictEqual({
      year: 2024,
      month: 4,
      date: 10,
      sameDate: true,
      hours: 15,
      minutes: 30,
      invalid: undefined,
    });
  });

  it('validates non-empty dates only', () => {
    expect.hasAssertions();

    expect([
      utils.isDateValid(null),
      utils.isDateValid(undefined),
      utils.isDateValid('   '),
      utils.isDateValid('not-a-date'),
      utils.isDateValid('10/05/2024'),
      utils.isDateValid(new Date(2024, 4, 10)),
    ]).toStrictEqual([false, false, false, false, true, true]);
  });

  it('formats valid dates to local offset date-time strings or null for invalid input', () => {
    expect.hasAssertions();

    expect(utils.formatDateToUTC(null)).toBeNull();
    expect(utils.formatDateToUTC('not-a-date')).toBeNull();
    expect(utils.formatDateToUTC(0 as unknown as Date)).toBeNull();
    expect(utils.formatDateToUTC('10/05/2024')).toMatch(
      /^2024-05-10T00:00:00[+-]\d{2}:\d{2}$/,
    );
  });

  it('formats date strings as UTC Date objects and returns undefined for empty input', () => {
    expect.hasAssertions();

    const localDate = new Date(2024, 4, 10);

    expect(utils.formatDateStringToUTC()).toBeUndefined();
    expect(utils.formatDateStringToUTC(localDate)?.toISOString()).toBe(
      '2024-05-10T00:00:00.000Z',
    );
  });

  it('formats Date objects with default and custom date-fns patterns', () => {
    expect.hasAssertions();

    const date = new Date(2024, 4, 10);

    expect(utils.formatDate(null)).toBe('');
    expect(utils.formatDate(undefined)).toBe('');
    expect(utils.formatDate(date)).toBe('10 May 2024');
    expect(utils.formatDate(date, 'yyyy/MM/dd')).toBe('2024/05/10');
  });

  it('formats dates to strings or null for null, undefined, and invalid values', () => {
    expect.hasAssertions();

    const date = new Date(2024, 4, 10);

    expect([
      utils.formatDateToString(null),
      utils.formatDateToString(undefined),
      utils.formatDateToString('not-a-date'),
      utils.formatDateToString(0 as unknown as Date),
      utils.formatDateToString('10/05/2024'),
      utils.formatDateToString('10/05/2024', 'yyyy/MM/dd'),
      utils.formatDateToString(date),
    ]).toStrictEqual([
      null,
      null,
      null,
      null,
      '10 May 2024',
      '2024/05/10',
      '10 May 2024',
    ]);
  });

  it('formats date-time values with time or returns null for invalid input', () => {
    expect.hasAssertions();

    const date = new Date(2024, 4, 10, 15, 30);

    expect([
      utils.formatDateTimeToString(null),
      utils.formatDateTimeToString(undefined),
      utils.formatDateTimeToString('not-a-date'),
      utils.formatDateTimeToString(0 as unknown as Date),
    ]).toStrictEqual([null, null, null, null]);

    // The parse format carries an offset token (`xxx`), so an offset-bearing string resolves to
    // an absolute instant and is then rendered in the runner's local zone. Asserting a literal
    // "3:30 PM" therefore only holds in Australian zones - it read 5:30 AM on the UTC CI runner.
    // Asserting that the string and Date paths agree on the same instant pins the behaviour that
    // actually matters (the offset is honoured, not discarded) in every zone.
    const sameInstant = new Date(Date.UTC(2024, 4, 10, 5, 30));

    expect([
      utils.formatDateTimeToString('2024-05-10T15:30:00+10:00'),
      utils.formatDateTimeToString(sameInstant),
      utils.formatDateTimeToString(date, 'yyyy/MM/dd HH:mm'),
    ]).toStrictEqual([
      utils.formatDateTimeToString(sameInstant),
      utils.formatDateTimeToString(sameInstant),
      '2024/05/10 15:30',
    ]);
  });
});

describe('formatting helpers', () => {
  it('formats bytes with zero, default decimals, and negative decimal inputs', () => {
    expect.hasAssertions();

    expect([
      utils.formatBytes(0),
      utils.formatBytes(1024),
      utils.formatBytes(1536),
      utils.formatBytes(1536, -1),
    ]).toStrictEqual(['0 Bytes', '1 kb', '1.5 kb', '2 kb']);
  });

  it('formats calendar and financial reporting periods', () => {
    expect.hasAssertions();

    expect(utils.formatReportingPeriod('CY 2024')).toBe('2024');
    expect(utils.formatReportingPeriod('FY 2021-2022')).toBe('2021-22');
  });

  it('splits PascalCase words using lower, sentence, and upper/default casing', () => {
    expect.hasAssertions();

    expect([
      utils.splitPascalCase('MeasurementReportStatus', 'lower'),
      utils.splitPascalCase('MeasurementReportStatus', 'sentence'),
      utils.splitPascalCase('MeasurementReportStatus', 'upper'),
      utils.splitPascalCase('lowercase', 'lower'),
      utils.splitPascalCase('lowercase', 'sentence'),
      utils.splitPascalCase('lowercase', 'upper'),
    ]).toStrictEqual([
      'measurement report status',
      'Measurement report status',
      'Measurement Report Status',
      'lowercase',
      'lowercase',
      'lowercase',
    ]);
  });

  it('converts base64 data to a Blob with the requested type and slice size', async () => {
    expect.hasAssertions();

    const blob = utils.base64toBlob(btoa('hello world'), 'text/plain', 4);

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(11);
    await expect(blob.text()).resolves.toBe('hello world');
  });

  it('uses the default base64 Blob slice size when none is provided', async () => {
    expect.hasAssertions();

    const blob = utils.base64toBlob(btoa('default slice'), 'text/plain');

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(13);
    await expect(blob.text()).resolves.toBe('default slice');
  });

  it('substitutes 0 when codePointAt returns undefined for a code unit', () => {
    expect.hasAssertions();

    const spy = vi
      .spyOn(String.prototype, 'codePointAt')
      .mockReturnValueOnce(undefined);
    const blob = utils.base64toBlob(btoa('x'), 'text/plain', 512);
    spy.mockRestore();

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(1);
  });

  it('formats currency amounts and returns null for absent values', () => {
    expect.hasAssertions();

    expect(utils.formatCurrencyAmount(undefined)).toBeNull();
    expect(utils.formatCurrencyAmount(null as unknown as number)).toBeNull();
    expect(utils.formatCurrencyAmount(1234.5)).toBe('$1,234.50');
  });
});

describe('async helpers', () => {
  it('resolves sleep after the requested delay', async () => {
    expect.hasAssertions();

    vi.useFakeTimers();
    const resolved = vi.fn<(value: unknown) => void>();

    const promise = utils.sleep(25).then(resolved);
    await vi.advanceTimersByTimeAsync(24);

    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await promise;

    expect(resolved).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
