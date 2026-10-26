import { describe, it, expect } from 'vitest';
import * as Yup from 'yup';
// Side-effect import registers all custom Yup string methods
import '../../../ClientApp/src/validationSchemas/yupExtensions';

/** Synchronous validity helper — keeps test bodies concise */
const valid = (schema: Yup.StringSchema, value: string | null | undefined) =>
  schema.isValidSync(value);

type ValidityCase = {
  description: string;
  value: string | undefined;
  expected: boolean;
};

// ---------------------------------------------------------------------------
// fixedDigits
// ---------------------------------------------------------------------------
describe('fixedDigits', () => {
  const schema = Yup.string().fixedDigits(4);

  it('accepts a string of exactly 4 digits', () => {
    expect.hasAssertions();

    expect(valid(schema, '1234')).toBe(true);
  });

  it.each<ValidityCase>([
    {
      description: 'rejects a string of 3 digits (too short)',
      value: '123',
      expected: false,
    },
    {
      description: 'rejects a string of 5 digits (too long)',
      value: '12345',
      expected: false,
    },
    {
      description: 'rejects a non-digit string',
      value: 'abcd',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string (optional by default)', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// numbersOnly
// ---------------------------------------------------------------------------
describe('numbersOnly', () => {
  const schema = Yup.string().numbersOnly();

  it('accepts a string of digits', () => {
    expect.hasAssertions();

    expect(valid(schema, '12345')).toBe(true);
  });

  it('rejects a string containing letters', () => {
    expect.hasAssertions();

    expect(valid(schema, '123abc')).toBe(false);
  });

  it('rejects a decimal number (dot is not a digit)', () => {
    expect.hasAssertions();

    expect(valid(schema, '12.5')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// minValue
// minValue checks the numeric integer value parsed from the string is >= min
// ---------------------------------------------------------------------------
describe('minValue', () => {
  const schema = Yup.string().minValue(10);

  it.each<ValidityCase>([
    {
      description: 'accepts a numeric string equal to the minimum',
      value: '10',
      expected: true,
    },
    {
      description: 'accepts a numeric string above the minimum',
      value: '100',
      expected: true,
    },
    {
      description: 'rejects a numeric string below the minimum',
      value: '9',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a non-numeric string', () => {
    expect.hasAssertions();

    expect(valid(schema, 'abc')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// maxValue
// maxValue checks the numeric integer value parsed from the string is <= max
// ---------------------------------------------------------------------------
describe('maxValue', () => {
  const schema = Yup.string().maxValue(100);

  it.each<ValidityCase>([
    {
      description: 'accepts a numeric string equal to the maximum',
      value: '100',
      expected: true,
    },
    {
      description: 'accepts a numeric string below the maximum',
      value: '50',
      expected: true,
    },
    {
      description: 'rejects a numeric string above the maximum',
      value: '101',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a non-numeric string', () => {
    expect.hasAssertions();

    expect(valid(schema, 'abc')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// decimalNumbersOnly
// Regex: /^-?[0-9]+\.?[0-9]*$/
// ---------------------------------------------------------------------------
describe('decimalNumbersOnly', () => {
  const schema = Yup.string().decimalNumbersOnly();

  it.each<ValidityCase>([
    {
      description: 'accepts an integer string',
      value: '42',
      expected: true,
    },
    {
      description: 'accepts a decimal string',
      value: '3.14',
      expected: true,
    },
    {
      description: 'accepts a negative decimal string',
      value: '-7.5',
      expected: true,
    },
    {
      description: 'rejects a string with letters',
      value: '3.14abc',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a string with two decimal points', () => {
    expect.hasAssertions();

    expect(valid(schema, '1.2.3')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// postcode
// Valid: exactly 4 digits AND (200–299 OR 800–9999)
// ---------------------------------------------------------------------------
describe('postcode', () => {
  const schema = Yup.string().postcode();

  it.each<ValidityCase>([
    {
      description: 'accepts a valid ACT postcode (e.g. 0200)',
      // 200 is in range 200-299, length 4 as "0200"
      value: '0200',
      expected: true,
    },
    {
      description: 'accepts a valid NSW postcode (e.g. 2000)',
      value: '2000',
      expected: true,
    },
    {
      description: 'accepts a valid WA postcode (e.g. 6000)',
      value: '6000',
      expected: true,
    },
    {
      description: 'rejects a 3-digit string (not 4 chars)',
      value: '200',
      expected: false,
    },
    {
      description: 'rejects postcode 0100 (out of valid range)',
      // 100 is not in 200-299 or 800-9999
      value: '0100',
      expected: false,
    },
    {
      description: 'rejects a postcode with letters',
      value: '20AB',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// phone — general (landline + mobile)
// landline: /^(?:\+61 ?|0)[2-47-8] ?\d{4} ?\d{4}|1[38]00 ?\d{3} ?\d{3}|13 ?\d{2} ?\d{2}$/
// mobile:   /^(?:\+61 ?|0)4\d{2} ?\d{3} ?\d{3}$/
// ---------------------------------------------------------------------------
describe('phone (general)', () => {
  const schema = Yup.string().phone();

  it.each<ValidityCase>([
    {
      description: 'accepts a valid Australian mobile number',
      value: '0412345678',
      expected: true,
    },
    {
      description: 'accepts a valid landline number',
      value: '0212345678',
      expected: true,
    },
    {
      description: 'accepts a landline number with +61 prefix and spacing',
      value: '+61 2 1234 5678',
      expected: true,
    },
    {
      description: 'accepts a 1300 number',
      value: '1300123456',
      expected: true,
    },
    {
      description: 'accepts an 1800 number with spacing',
      value: '1800 123 456',
      expected: true,
    },
    {
      description: 'accepts a 13 number with spacing',
      value: '13 12 34',
      expected: true,
    },
    {
      description: 'rejects an invalid phone number',
      value: '12345',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a phone number with letters', () => {
    expect.hasAssertions();

    expect(valid(schema, '041234ABCD')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// phone — mobileOnly
// ---------------------------------------------------------------------------
describe('phone (mobileOnly)', () => {
  const schema = Yup.string().phone(true);

  it.each<ValidityCase>([
    {
      description: 'accepts a valid Australian mobile number',
      value: '0412345678',
      expected: true,
    },
    {
      description: 'accepts a mobile with +61 prefix',
      value: '+61412345678',
      expected: true,
    },
    {
      description: 'accepts a mobile with grouped spacing',
      value: '0412 345 678',
      expected: true,
    },
    {
      description: 'rejects a landline number',
      value: '0212345678',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------
describe('email', () => {
  const schema = Yup.string().email();

  it.each<ValidityCase>([
    {
      description: 'accepts a standard email address',
      value: 'user@example.com',
      expected: true,
    },
    {
      description: 'accepts an email with sub-domain',
      value: 'user@mail.example.co.uk',
      expected: true,
    },
    {
      description: 'rejects an email without @',
      value: 'userexample.com',
      expected: false,
    },
    {
      description: 'rejects an email without a TLD',
      value: 'user@example',
      expected: false,
    },
    {
      description: 'rejects an email with an empty TLD',
      value: 'user@example.',
      expected: false,
    },
    {
      description: 'rejects an email with spaces',
      value: 'user @example.com',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// minEntered — checks string length >= minLength
// ---------------------------------------------------------------------------
describe('minEntered', () => {
  const schema = Yup.string().minEntered(5);

  it.each<ValidityCase>([
    {
      description: 'accepts a string at exactly the minimum length',
      value: 'hello',
      expected: true,
    },
    {
      description: 'accepts a string longer than the minimum',
      value: 'hello world',
      expected: true,
    },
    {
      description: 'rejects a string shorter than the minimum',
      value: 'hi',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addressFormat
// Regex: /^[0-9A-Za-z '()/\-&,."]*$/
// ---------------------------------------------------------------------------
describe('addressFormat', () => {
  const schema = Yup.string().addressFormat();

  it.each<ValidityCase>([
    {
      description: 'accepts a standard address string',
      value: '123 Main Street',
      expected: true,
    },
    {
      description: 'accepts address with allowed special chars',
      value: "Unit 3/42 O'Brien Ave, Sydney (NSW)",
      expected: true,
    },
    {
      description: 'rejects a string with disallowed characters like <',
      value: '<script>',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a string with an exclamation mark', () => {
    expect.hasAssertions();

    expect(valid(schema, '123 Street!')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// allowedFormat — default / extended=true
// Regex (extended): /^[ -~\s–—’‘“”]*$/
// Accepts all printable ASCII plus curly quotes/dashes
// ---------------------------------------------------------------------------
describe('allowedFormat (extended/default)', () => {
  const schema = Yup.string().allowedFormat();

  it.each<ValidityCase>([
    {
      description: 'accepts standard printable ASCII text',
      value: 'Hello World! 123 #test@example.com',
      expected: true,
    },
    {
      description: 'accepts curly quotes (Unicode)',
      value: '‘Hello’ “Hello”',
      expected: true,
    },
    {
      description:
        'rejects a control character (e.g. tab might pass but NUL should fail)',
      // \u0000 (NUL) is below space (0x20) in ASCII table — outside [ -~] range
      value: 'Hello\u0000World',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// allowedFormat — restricted (extended=false)
// Regex: /^[-–—0-9A-Za-z '.&#,]*$/
// ---------------------------------------------------------------------------
describe('allowedFormat (restricted, extended=false)', () => {
  const schema = Yup.string().allowedFormat(false);

  it.each<ValidityCase>([
    {
      description: 'rejects an apostrophe — not in restricted charset',
      value: "John & Sons, 123 St. O'Brien",
      expected: false,
    },
    {
      description: 'accepts chars in the restricted set',
      value: 'John Sons 123 St',
      expected: true,
    },
    {
      description: 'accepts hyphens and ampersands',
      value: 'A & B-C',
      expected: true,
    },
    {
      description: 'rejects @ symbol (not in restricted set)',
      value: 'user@example',
      expected: false,
    },
    {
      description: 'rejects ! symbol',
      value: 'Hello!',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// nameAllowedFormat — default / extended=true
// Regex (extended): /[0-9a-zA-Z$ :%,;*–—’“”"@&?'#=~/\\_\-|(){}]$/
// This is a SUFFIX check (ends-with), not a full-string match
// ---------------------------------------------------------------------------
describe('nameAllowedFormat (extended/default)', () => {
  const schema = Yup.string().nameAllowedFormat();

  it.each<ValidityCase>([
    {
      description: 'accepts a simple name',
      value: 'John Smith',
      expected: true,
    },
    {
      description: 'accepts a name ending with a letter',
      value: 'Mary-Jane',
      expected: true,
    },
    {
      description: 'rejects a period — not in extended set',
      // period not in extended set
      value: 'Test Corp.',
      expected: false,
    },
    {
      description: 'accepts a name ending with a digit',
      value: 'Division 2',
      expected: true,
    },
    {
      description:
        'suffix-only check: a string with an invalid prefix but valid last character passes (surprising behavior)',
      // The extended regex is /$/-anchored only — it validates the last character, not the full string
      value: '<script>Z',
      expected: true,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// nameAllowedFormat — restricted (extended=false)
// Regex: /^[-–—A-Za-z ']*$/
// Full string match — only letters, spaces, hyphens, en-dash, em-dash
// ---------------------------------------------------------------------------
describe('nameAllowedFormat (restricted, extended=false)', () => {
  const schema = Yup.string().nameAllowedFormat(false);

  it.each<ValidityCase>([
    {
      description: 'accepts a simple name with letters and spaces',
      value: 'John Smith',
      expected: true,
    },
    {
      description: 'accepts a hyphenated name',
      value: 'Mary-Jane',
      expected: true,
    },
    {
      description:
        'rejects a straight apostrophe — restricted regex uses left-single-quote U+2018, not U+0027',
      // The restricted regex /^[-–—A-Za-z ']*$/ uses U+2018 (left single quote), not U+0027
      // A straight apostrophe is NOT in the character class and therefore fails
      value: "O'Brien",
      expected: false,
    },
    {
      description: 'rejects digits in restricted mode',
      value: 'Division 2',
      expected: false,
    },
    {
      description: 'rejects @ in restricted mode',
      value: 'user@name',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// noConsecutiveChars
// Default threshold=3: numChars = 3-1 = 2 → rejects if same letter repeats 3+ times
// threshold=4: numChars = 4-1 = 3 → rejects if same letter repeats 4+ times
// ---------------------------------------------------------------------------
describe('noConsecutiveChars', () => {
  // Default threshold=3: disallows 3+ consecutive same letters (aaa fails, aa passes)
  const schemaDefault = Yup.string().noConsecutiveChars();

  it('accepts two consecutive identical chars (below threshold)', () => {
    expect.hasAssertions();

    expect(valid(schemaDefault, 'aabbcc')).toBe(true);
  });

  it.each<ValidityCase>([
    {
      description: 'rejects three consecutive identical chars (at threshold)',
      value: 'aaabbb',
      expected: false,
    },
    {
      description: 'rejects four consecutive identical chars',
      value: 'aaaa',
      expected: false,
    },
    {
      description: 'is case-insensitive (AAA should fail)',
      value: 'AAAtest',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schemaDefault, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schemaDefault, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schemaDefault, undefined)).toBe(true);
  });

  // threshold=4: numChars = 4-1 = 3 → rejects 4+ repeats
  const schema4 = Yup.string().noConsecutiveChars(4);

  it('accepts three consecutive identical chars when threshold=4', () => {
    expect.hasAssertions();

    expect(valid(schema4, 'aaabbb')).toBe(true);
  });

  it('rejects four consecutive identical chars when threshold=4', () => {
    expect.hasAssertions();

    expect(valid(schema4, 'aaaa')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// atLeastOneChar
// Regex: /(?=.*[a-z])/i — must contain at least one letter
// ---------------------------------------------------------------------------
describe('atLeastOneChar', () => {
  const schema = Yup.string().atLeastOneChar();

  it.each<ValidityCase>([
    {
      description: 'accepts a string with letters',
      value: 'abc123',
      expected: true,
    },
    {
      description: 'accepts a single letter',
      value: 'a',
      expected: true,
    },
    {
      description: 'rejects a string of only digits',
      value: '12345',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a string of only punctuation', () => {
    expect.hasAssertions();

    expect(valid(schema, '!@#$%')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// noConsecutivePuncuation (note: intentional spelling in source)
// Regex: /([ '’\-–—])\1+/i — consecutive same punctuation chars fail
// ---------------------------------------------------------------------------
describe('noConsecutivePuncuation', () => {
  const schema = Yup.string().noConsecutivePuncuation();

  it.each<ValidityCase>([
    {
      description: 'accepts a string with single spaces',
      value: 'Hello World',
      expected: true,
    },
    {
      description: 'accepts a name with a single hyphen',
      value: 'Mary-Jane',
      expected: true,
    },
    {
      description: 'accepts a name with a single apostrophe',
      value: "O'Brien",
      expected: true,
    },
    {
      description: 'rejects double spaces',
      value: 'Hello  World',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects double hyphens', () => {
    expect.hasAssertions();

    expect(valid(schema, 'Mary--Jane')).toBe(false);
  });

  it('rejects double apostrophes', () => {
    expect.hasAssertions();

    expect(valid(schema, "O''Brien")).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// numberWithinRange
// Uses parseFloat — accepts decimals; checks >= min AND <= max
// ---------------------------------------------------------------------------
describe('numberWithinRange', () => {
  const schema = Yup.string().numberWithinRange(1, 10);

  it.each<ValidityCase>([
    {
      description: 'accepts a value at the lower bound',
      value: '1',
      expected: true,
    },
    {
      description: 'accepts a value at the upper bound',
      value: '10',
      expected: true,
    },
    {
      description: 'accepts a decimal value within range',
      value: '5.5',
      expected: true,
    },
    {
      description: 'rejects a value below the lower bound',
      value: '0',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('rejects a value above the upper bound', () => {
    expect.hasAssertions();

    expect(valid(schema, '11')).toBe(false);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// maxLength
// ---------------------------------------------------------------------------
describe('maxLength', () => {
  const schema = Yup.string().maxLength(10);

  it.each<ValidityCase>([
    {
      description: 'accepts a string at exactly the maximum length',
      value: '1234567890',
      expected: true,
    },
    {
      description: 'accepts a string shorter than the maximum',
      value: 'hello',
      expected: true,
    },
    {
      description: 'rejects a string longer than the maximum',
      value: '12345678901',
      expected: false,
    },
  ])('$description', ({ value, expected }) => {
    expect.hasAssertions();

    expect(valid(schema, value)).toBe(expected);
  });

  it('passes on empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(true);
  });

  it('passes on undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isRequired
// Trims whitespace — whitespace-only strings fail; null/undefined fail
// ---------------------------------------------------------------------------
describe('isRequired', () => {
  const schema = Yup.string().isRequired('Field');

  it('accepts a non-empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, 'hello')).toBe(true);
  });

  it('accepts a string with leading/trailing spaces but non-empty content', () => {
    expect.hasAssertions();

    expect(valid(schema, '  hello  ')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect.hasAssertions();

    expect(valid(schema, '')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect.hasAssertions();

    expect(valid(schema, '   ')).toBe(false);
  });

  it('rejects undefined', () => {
    expect.hasAssertions();

    expect(valid(schema, undefined)).toBe(false);
  });

  it('provides the correct error message when label is supplied', async () => {
    expect.hasAssertions();

    await expect(
      Yup.string().isRequired('Email').validate(undefined),
    ).rejects.toThrow('Email is required');
  });

  it('provides the path-based error message when no label is supplied', async () => {
    expect.hasAssertions();

    await expect(
      Yup.object({ myField: Yup.string().isRequired() }).validate({
        myField: '',
      }),
    ).rejects.toThrow('is required');
  });
});
