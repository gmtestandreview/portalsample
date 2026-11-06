import { describe, expect, it } from 'vitest';
import * as Yup from 'yup';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import '../../../ClientApp/src/validationSchemas/yupExtensions/index';
import { registerYupStringExtensions } from '../../../ClientApp/src/validationSchemas/yupExtensions/stringExtensions';

const valid = (schema: Yup.StringSchema, value: unknown) =>
  schema.isValidSync(value);

const INVALID_MARKUP =
  String.fromCodePoint(60) + 'bad' + String.fromCodePoint(62);

const nonNullableSchemaCases = [
  ['fixedDigits', Yup.string().fixedDigits(2), null],
  ['numbersOnly', Yup.string().numbersOnly(), null],
  ['minValue', Yup.string().minValue(2), null],
  ['maxValue', Yup.string().maxValue(2), null],
  ['decimalNumbersOnly', Yup.string().decimalNumbersOnly(), null],
  ['postcode', Yup.string().postcode(), null],
  ['addressFormat', Yup.string().addressFormat(), null],
  ['phone', Yup.string().phone(), null],
  ['email', Yup.string().email(), null],
  ['noConsecutivePuncuation', Yup.string().noConsecutivePuncuation(), null],
  ['atLeastOneChar', Yup.string().atLeastOneChar(), null],
  ['isRequired', Yup.string().isRequired(), null],
  ['noConsecutiveChars', Yup.string().noConsecutiveChars(1), null],
  ['allowedFormat', Yup.string().allowedFormat(), null],
  ['nameAllowedFormat', Yup.string().nameAllowedFormat(), null],
  ['businessName', Yup.string().businessName(), null],
  ['minEntered', Yup.string().minEntered(2), null],
  ['numberWithinRange', Yup.string().numberWithinRange(1, 2), null],
  ['maxLength', Yup.string().maxLength(2), null],
] as const;

const nullableSchemaCases = [
  ['fixedDigits', Yup.string().nullable().fixedDigits(2), null],
  ['numbersOnly', Yup.string().nullable().numbersOnly(), null],
  ['minValue', Yup.string().nullable().minValue(2), null],
  ['maxValue', Yup.string().nullable().maxValue(2), null],
  ['decimalNumbersOnly', Yup.string().nullable().decimalNumbersOnly(), null],
  ['postcode', Yup.string().nullable().postcode(), null],
  ['addressFormat', Yup.string().nullable().addressFormat(), null],
  ['phone', Yup.string().nullable().phone(), null],
  ['email', Yup.string().nullable().email(), null],
  [
    'noConsecutivePuncuation',
    Yup.string().nullable().noConsecutivePuncuation(),
    null,
  ],
  ['atLeastOneChar', Yup.string().nullable().atLeastOneChar(), null],
  ['noConsecutiveChars', Yup.string().nullable().noConsecutiveChars(), null],
  ['allowedFormat', Yup.string().nullable().allowedFormat(), null],
  ['nameAllowedFormat', Yup.string().nullable().nameAllowedFormat(), null],
  ['businessName', Yup.string().nullable().businessName(), null],
  ['minEntered', Yup.string().nullable().minEntered(2), null],
  ['numberWithinRange', Yup.string().nullable().numberWithinRange(1, 2), null],
  ['maxLength', Yup.string().nullable().maxLength(2), null],
] as const;

const fallbackMessageCases = [
  [
    'numbersOnly',
    Yup.string().numbersOnly(),
    'abc',
    'code must only include numbers',
  ],
  [
    'minValue',
    Yup.string().minValue(10),
    '9',
    'code cannot be less than 10 characters',
  ],
  [
    'maxValue',
    Yup.string().maxValue(10),
    '11',
    'code cannot be greater than 10 characters',
  ],
  [
    'postcode',
    Yup.string().postcode(),
    '0100',
    'code is not a valid Australian postcode',
  ],
  [
    'phone',
    Yup.string().phone(undefined, undefined, 'Custom phone'),
    'badbad',
    'Custom phone',
  ],
  ['email', Yup.string().email(), 'bad', 'code is not a valid email address'],
  [
    'noConsecutivePuncuation',
    Yup.string().noConsecutivePuncuation(),
    'a  b',
    'code must not contain consecutive apostrophe, hyphen or space characters',
  ],
  [
    'atLeastOneChar',
    Yup.string().atLeastOneChar(),
    '123',
    'code must contain at least one letter',
  ],
  [
    'noConsecutiveChars',
    Yup.string().noConsecutiveChars(1),
    'aa',
    'code cannot have more than 1 repeating characters',
  ],
  [
    'allowedFormat',
    Yup.string().allowedFormat(false),
    '@',
    'code has invalid characters. Please use only letters, periods, numbers, and keyboard characters',
  ],
  [
    'nameAllowedFormat',
    Yup.string().nameAllowedFormat(false),
    '1',
    'code has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen',
  ],
  [
    'businessName',
    Yup.string().businessName(),
    INVALID_MARKUP,
    'code contains invalid characters',
  ],
  [
    'minEntered',
    Yup.string().minEntered(2),
    'a',
    'code cannot be less than 2 characters',
  ],
  [
    'numberWithinRange',
    Yup.string().numberWithinRange(1, 2),
    '3',
    'code must be between 1 and 2',
  ],
  [
    'maxLength',
    Yup.string().maxLength(2),
    'abc',
    'code cannot be greater than 2 characters',
  ],
] as const;

const labelMessageCases = [
  [
    'fixedDigits',
    Yup.string().fixedDigits(2, 'Code'),
    '1',
    'Code must be 2 digits',
  ],
  [
    'numbersOnly',
    Yup.string().numbersOnly('Code'),
    'abc',
    'Code must only include numbers',
  ],
  [
    'minValue',
    Yup.string().minValue(10, 'Code'),
    '9',
    'Code cannot be less than 10 characters',
  ],
  [
    'maxValue',
    Yup.string().maxValue(10, 'Code'),
    '11',
    'Code cannot be greater than 10 characters',
  ],
  [
    'decimalNumbersOnly',
    Yup.string().decimalNumbersOnly('Code'),
    'abc',
    'Code must only include numbers',
  ],
  [
    'postcode',
    Yup.string().postcode('Postcode'),
    '0100',
    'Postcode is not a valid Australian postcode',
  ],
  [
    'addressFormat',
    Yup.string().addressFormat('Address'),
    INVALID_MARKUP,
    'Address contains invalid characters',
  ],
  [
    'phone',
    Yup.string().phone(false, 'Phone'),
    'badbad',
    'Phone is not a valid phone number',
  ],
  [
    'email',
    Yup.string().email('Email'),
    'bad',
    'Email is not a valid email address',
  ],
  [
    'noConsecutivePuncuation',
    Yup.string().noConsecutivePuncuation('Name'),
    'a  b',
    'Name must not contain consecutive apostrophe, hyphen or space characters',
  ],
  [
    'atLeastOneChar',
    Yup.string().atLeastOneChar('Code'),
    '123',
    'Code must contain at least one letter',
  ],
  [
    'noConsecutiveChars',
    Yup.string().noConsecutiveChars(3, 'Code'),
    'aaa',
    'Code cannot have more than 2 repeating characters',
  ],
  [
    'allowedFormat',
    Yup.string().allowedFormat(false, 'Code'),
    '@',
    'Code has invalid characters. Please use only letters, periods, numbers, and keyboard characters',
  ],
  [
    'nameAllowedFormat',
    Yup.string().nameAllowedFormat(false, 'Name'),
    '1',
    'Name has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen',
  ],
  [
    'businessName',
    Yup.string().businessName('Business name'),
    INVALID_MARKUP,
    'Business name contains invalid characters',
  ],
  [
    'minEntered',
    Yup.string().minEntered(2, 'Code'),
    'a',
    'Code cannot be less than 2 characters',
  ],
  [
    'numberWithinRange',
    Yup.string().numberWithinRange(1, 2, 'Code'),
    '3',
    'Code must be between 1 and 2',
  ],
  [
    'maxLength',
    Yup.string().maxLength(2, 'Code'),
    'abc',
    'Code cannot be greater than 2 characters',
  ],
] as const;

describe('yup string extension branch coverage', () => {
  it.each(nonNullableSchemaCases)(
    'rejects null for non-nullable %s schemas',
    (_name, schema, value) => {
      expect.hasAssertions();

      expect(valid(schema, value)).toBe(false);
    },
  );

  it.each(nullableSchemaCases)(
    'allows null for nullable %s schemas',
    (_name, schema, value) => {
      expect.hasAssertions();

      expect(valid(schema, value)).toBe(true);
    },
  );

  // Yup rejects null for a non-nullable schema before any custom test runs, so
  // the isValidSync cases above never reach the callbacks' own null handling.
  // These call the registered test directly to pin that behaviour.
  describe('null handed straight to the registered test', () => {
    const runTest = (
      schema: Yup.AnySchema,
      name: string,
      value: string | null | undefined,
      nullable: boolean,
    ): unknown => {
      const config = schema.tests.find(
        (t) => t.OPTIONS?.name === name,
      )?.OPTIONS;
      const context = {
        schema: nullable ? Yup.string().nullable() : Yup.string(),
      } as unknown as Yup.TestContext;

      // A missing test returns undefined, which fails every toBe assertion below.
      return config?.test.call(context, value, context);
    };

    const cases: readonly [
      string,
      (s: Yup.StringSchema) => Yup.StringSchema,
    ][] = [
      ['fixedDigits', (s) => s.fixedDigits(2)],
      ['numbersOnly', (s) => s.numbersOnly()],
      ['minValue', (s) => s.minValue(2)],
      ['maxValue', (s) => s.maxValue(2)],
      ['decimalNumbersOnly', (s) => s.decimalNumbersOnly()],
      ['postcode', (s) => s.postcode()],
      ['addressFormat', (s) => s.addressFormat()],
      ['phone', (s) => s.phone()],
      ['email', (s) => s.email()],
      ['noConsecutivePuncuation', (s) => s.noConsecutivePuncuation()],
      ['atLeastOneChar', (s) => s.atLeastOneChar()],
      ['noConsecutiveChars', (s) => s.noConsecutiveChars()],
      ['allowedFormat', (s) => s.allowedFormat()],
      ['nameAllowedFormat', (s) => s.nameAllowedFormat()],
      ['businessName', (s) => s.businessName()],
      ['minEntered', (s) => s.minEntered(2)],
      ['numberWithinRange', (s) => s.numberWithinRange(1, 2)],
      ['maxLength', (s) => s.maxLength(2)],
    ];

    it.each(cases)(
      '%s fails closed on null for a non-nullable schema',
      (name, build) => {
        expect.hasAssertions();

        expect(runTest(build(Yup.string()), name, null, false)).toBe(false);
      },
    );

    it.each(cases)('%s accepts null for a nullable schema', (name, build) => {
      expect.hasAssertions();

      expect(runTest(build(Yup.string()).nullable(), name, null, true)).toBe(
        true,
      );
    });

    it.each([false, true])(
      'isRequired refuses null whether or not the schema is nullable (nullable: %s)',
      (nullable) => {
        expect.hasAssertions();

        expect(
          runTest(Yup.string().isRequired(), 'isRequired', null, nullable),
        ).toBe(false);
      },
    );

    it('isRequired lets a nullable schema skip the blank check but not a non-nullable one', () => {
      expect.hasAssertions();

      const schema = Yup.string().isRequired();

      expect(runTest(schema, 'isRequired', undefined, true)).toBe(true);
      expect(runTest(schema, 'isRequired', '  ', true)).toBe(true);
      expect(runTest(schema, 'isRequired', undefined, false)).toBe(false);
      expect(runTest(schema, 'isRequired', '  ', false)).toBe(false);
    });
  });

  it('uses explicit error messages before label and fallback messages', async () => {
    expect.hasAssertions();

    await expect(
      Yup.string().fixedDigits(2, 'Code', 'Custom fixed').validate('1'),
    ).rejects.toThrow('Custom fixed');
    await expect(
      Yup.string().numbersOnly('Code').validate('A'),
    ).rejects.toThrow('Code must only include numbers');
    await expect(
      Yup.object({ code: Yup.string().numbersOnly() }).validate({ code: 'A' }),
    ).rejects.toThrow('code must only include numbers');
  });

  it('casts numbers before applying string extension tests', () => {
    expect.hasAssertions();

    expect(valid(Yup.string().fixedDigits(2), 12)).toBe(true);
    expect(valid(Yup.string().postcode(), 2600)).toBe(true);
    expect(valid(Yup.string().phone(), 412345678)).toBe(false);
    expect(valid(Yup.string().email(), 12)).toBe(false);
  });

  it.each(fallbackMessageCases)(
    'uses fallback path messages for %s',
    async (_name, schema, value, message) => {
      expect.hasAssertions();

      await expect(
        Yup.object({ code: schema }).validate({ code: value }),
      ).rejects.toThrow(message);
    },
  );

  it.each(labelMessageCases)(
    'uses label messages for %s',
    async (_name, schema, value, message) => {
      expect.hasAssertions();

      await expect(schema.validate(value)).rejects.toThrow(message);
    },
  );

  it('covers postcode and businessName empty-value paths', () => {
    expect.hasAssertions();

    expect(Yup.string().postcode().isValidSync('')).toBe(true);
    expect(Yup.string().postcode().isValidSync('   ')).toBe(true);
    expect(Yup.string().businessName().isValidSync('')).toBe(true);
  });

  it('executes the yupExtensions barrel module explicitly', () => {
    expect.hasAssertions();

    expect(Yup.string().maxLength.bind(Yup.string())).toBeTypeOf('function');
  });

  it('allows repeat registration without adding duplicate methods', () => {
    expect.hasAssertions();

    registerYupStringExtensions();

    expect(Yup.string().maxLength.bind(Yup.string())).toBeTypeOf('function');
  });

  it('resets consecutive-letter tracking at non-letter characters', () => {
    expect.hasAssertions();

    const schema = Yup.string().noConsecutiveChars(2);

    expect(valid(schema, 'ab1a')).toBe(true);
    expect(valid(schema, 'ab1aa')).toBe(false);
  });
});
