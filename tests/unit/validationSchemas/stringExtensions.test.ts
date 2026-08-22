import { describe, it, expect } from 'vitest';
import * as Yup from 'yup';
// Side-effect import registers all custom Yup string methods
import '../../../ClientApp/src/validationSchemas/yupExtensions';

/** Synchronous validity helper — keeps test bodies concise */
const valid = (schema: Yup.StringSchema, value: string | null | undefined) =>
    schema.isValidSync(value);

// ---------------------------------------------------------------------------
// fixedDigits
// ---------------------------------------------------------------------------
describe('fixedDigits', () => {
    const schema = Yup.string().fixedDigits(4);

    it('accepts a string of exactly 4 digits', () => {
        expect(valid(schema, '1234')).toBe(true);
    });

    it('rejects a string of 3 digits (too short)', () => {
        expect(valid(schema, '123')).toBe(false);
    });

    it('rejects a string of 5 digits (too long)', () => {
        expect(valid(schema, '12345')).toBe(false);
    });

    it('rejects a non-digit string', () => {
        expect(valid(schema, 'abcd')).toBe(false);
    });

    it('passes on empty string (optional by default)', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// numbersOnly
// ---------------------------------------------------------------------------
describe('numbersOnly', () => {
    const schema = Yup.string().numbersOnly();

    it('accepts a string of digits', () => {
        expect(valid(schema, '12345')).toBe(true);
    });

    it('rejects a string containing letters', () => {
        expect(valid(schema, '123abc')).toBe(false);
    });

    it('rejects a decimal number (dot is not a digit)', () => {
        expect(valid(schema, '12.5')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// minValue
// minValue checks the numeric integer value parsed from the string is >= min
// ---------------------------------------------------------------------------
describe('minValue', () => {
    const schema = Yup.string().minValue(10);

    it('accepts a numeric string equal to the minimum', () => {
        expect(valid(schema, '10')).toBe(true);
    });

    it('accepts a numeric string above the minimum', () => {
        expect(valid(schema, '100')).toBe(true);
    });

    it('rejects a numeric string below the minimum', () => {
        expect(valid(schema, '9')).toBe(false);
    });

    it('rejects a non-numeric string', () => {
        expect(valid(schema, 'abc')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// maxValue
// maxValue checks the numeric integer value parsed from the string is <= max
// ---------------------------------------------------------------------------
describe('maxValue', () => {
    const schema = Yup.string().maxValue(100);

    it('accepts a numeric string equal to the maximum', () => {
        expect(valid(schema, '100')).toBe(true);
    });

    it('accepts a numeric string below the maximum', () => {
        expect(valid(schema, '50')).toBe(true);
    });

    it('rejects a numeric string above the maximum', () => {
        expect(valid(schema, '101')).toBe(false);
    });

    it('rejects a non-numeric string', () => {
        expect(valid(schema, 'abc')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// decimalNumbersOnly
// Regex: /^-?[0-9]+\.?[0-9]*$/
// ---------------------------------------------------------------------------
describe('decimalNumbersOnly', () => {
    const schema = Yup.string().decimalNumbersOnly();

    it('accepts an integer string', () => {
        expect(valid(schema, '42')).toBe(true);
    });

    it('accepts a decimal string', () => {
        expect(valid(schema, '3.14')).toBe(true);
    });

    it('accepts a negative decimal string', () => {
        expect(valid(schema, '-7.5')).toBe(true);
    });

    it('rejects a string with letters', () => {
        expect(valid(schema, '3.14abc')).toBe(false);
    });

    it('rejects a string with two decimal points', () => {
        expect(valid(schema, '1.2.3')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// postcode
// Valid: exactly 4 digits AND (200–299 OR 800–9999)
// ---------------------------------------------------------------------------
describe('postcode', () => {
    const schema = Yup.string().postcode();

    it('accepts a valid ACT postcode (e.g. 0200)', () => {
        // 200 is in range 200-299, length 4 as "0200"
        expect(valid(schema, '0200')).toBe(true);
    });

    it('accepts a valid NSW postcode (e.g. 2000)', () => {
        expect(valid(schema, '2000')).toBe(true);
    });

    it('accepts a valid WA postcode (e.g. 6000)', () => {
        expect(valid(schema, '6000')).toBe(true);
    });

    it('rejects a 3-digit string (not 4 chars)', () => {
        expect(valid(schema, '200')).toBe(false);
    });

    it('rejects postcode 0100 (out of valid range)', () => {
        // 100 is not in 200-299 or 800-9999
        expect(valid(schema, '0100')).toBe(false);
    });

    it('rejects a postcode with letters', () => {
        expect(valid(schema, '20AB')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
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

    it('accepts a valid Australian mobile number', () => {
        expect(valid(schema, '0412345678')).toBe(true);
    });

    it('accepts a valid landline number', () => {
        expect(valid(schema, '0212345678')).toBe(true);
    });

    it('accepts a 1300 number', () => {
        expect(valid(schema, '1300123456')).toBe(true);
    });

    it('rejects an invalid phone number', () => {
        expect(valid(schema, '12345')).toBe(false);
    });

    it('rejects a phone number with letters', () => {
        expect(valid(schema, '041234ABCD')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// phone — mobileOnly
// ---------------------------------------------------------------------------
describe('phone (mobileOnly)', () => {
    const schema = Yup.string().phone(true);

    it('accepts a valid Australian mobile number', () => {
        expect(valid(schema, '0412345678')).toBe(true);
    });

    it('accepts a mobile with +61 prefix', () => {
        expect(valid(schema, '+61412345678')).toBe(true);
    });

    it('rejects a landline number', () => {
        expect(valid(schema, '0212345678')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------
describe('email', () => {
    const schema = Yup.string().email();

    it('accepts a standard email address', () => {
        expect(valid(schema, 'user@example.com')).toBe(true);
    });

    it('accepts an email with sub-domain', () => {
        expect(valid(schema, 'user@mail.example.co.uk')).toBe(true);
    });

    it('rejects an email without @', () => {
        expect(valid(schema, 'userexample.com')).toBe(false);
    });

    it('rejects an email without a TLD', () => {
        expect(valid(schema, 'user@example')).toBe(false);
    });

    it('rejects an email with spaces', () => {
        expect(valid(schema, 'user @example.com')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// minEntered — checks string length >= minLength
// ---------------------------------------------------------------------------
describe('minEntered', () => {
    const schema = Yup.string().minEntered(5);

    it('accepts a string at exactly the minimum length', () => {
        expect(valid(schema, 'hello')).toBe(true);
    });

    it('accepts a string longer than the minimum', () => {
        expect(valid(schema, 'hello world')).toBe(true);
    });

    it('rejects a string shorter than the minimum', () => {
        expect(valid(schema, 'hi')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// addressFormat
// Regex: /^[0-9A-Za-z '()/\-&,."]*$/
// ---------------------------------------------------------------------------
describe('addressFormat', () => {
    const schema = Yup.string().addressFormat();

    it('accepts a standard address string', () => {
        expect(valid(schema, '123 Main Street')).toBe(true);
    });

    it('accepts address with allowed special chars', () => {
        expect(valid(schema, "Unit 3/42 O'Brien Ave, Sydney (NSW)")).toBe(true);
    });

    it('rejects a string with disallowed characters like <', () => {
        expect(valid(schema, '<script>')).toBe(false);
    });

    it('rejects a string with an exclamation mark', () => {
        expect(valid(schema, '123 Street!')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
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

    it('accepts standard printable ASCII text', () => {
        expect(valid(schema, 'Hello World! 123 #test@example.com')).toBe(true);
    });

    it('accepts curly quotes (Unicode)', () => {
        expect(valid(schema, '‘Hello’ “Hello”')).toBe(true);
    });

    it('rejects a control character (e.g. tab might pass but NUL should fail)', () => {
        // \u0000 (NUL) is below space (0x20) in ASCII table — outside [ -~] range
        expect(valid(schema, 'Hello\u0000World')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// allowedFormat — restricted (extended=false)
// Regex: /^[-–—0-9A-Za-z '.&#,]*$/
// ---------------------------------------------------------------------------
describe('allowedFormat (restricted, extended=false)', () => {
    const schema = Yup.string().allowedFormat(false);

    it('rejects an apostrophe — not in restricted charset', () => {
        expect(valid(schema, "John & Sons, 123 St. O'Brien")).toBe(false); // apostrophe not in restricted set
    });

    it('accepts chars in the restricted set', () => {
        expect(valid(schema, 'John Sons 123 St')).toBe(true);
    });

    it('accepts hyphens and ampersands', () => {
        expect(valid(schema, 'A & B-C')).toBe(true);
    });

    it('rejects @ symbol (not in restricted set)', () => {
        expect(valid(schema, 'user@example')).toBe(false);
    });

    it('rejects ! symbol', () => {
        expect(valid(schema, 'Hello!')).toBe(false);
    });

    it('passes on empty string', () => {
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

    it('accepts a simple name', () => {
        expect(valid(schema, 'John Smith')).toBe(true);
    });

    it('accepts a name ending with a letter', () => {
        expect(valid(schema, 'Mary-Jane')).toBe(true);
    });

    it('rejects a period — not in extended set', () => {
        expect(valid(schema, 'Test Corp.')).toBe(false); // period not in extended set
    });

    it('accepts a name ending with a digit', () => {
        expect(valid(schema, 'Division 2')).toBe(true);
    });

    it('suffix-only check: a string with an invalid prefix but valid last character passes (surprising behavior)', () => {
        // The extended regex is /$/-anchored only — it validates the last character, not the full string
        expect(valid(schema, '<script>Z')).toBe(true);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
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

    it('accepts a simple name with letters and spaces', () => {
        expect(valid(schema, 'John Smith')).toBe(true);
    });

    it('accepts a hyphenated name', () => {
        expect(valid(schema, 'Mary-Jane')).toBe(true);
    });

    it('rejects a straight apostrophe — restricted regex uses left-single-quote U+2018, not U+0027', () => {
        // The restricted regex /^[-–—A-Za-z ']*$/ uses U+2018 (left single quote), not U+0027
        // A straight apostrophe is NOT in the character class and therefore fails
        expect(valid(schema, "O'Brien")).toBe(false);
    });

    it('rejects digits in restricted mode', () => {
        expect(valid(schema, 'Division 2')).toBe(false);
    });

    it('rejects @ in restricted mode', () => {
        expect(valid(schema, 'user@name')).toBe(false);
    });

    it('passes on empty string', () => {
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
        expect(valid(schemaDefault, 'aabbcc')).toBe(true);
    });

    it('rejects three consecutive identical chars (at threshold)', () => {
        expect(valid(schemaDefault, 'aaabbb')).toBe(false);
    });

    it('rejects four consecutive identical chars', () => {
        expect(valid(schemaDefault, 'aaaa')).toBe(false);
    });

    it('is case-insensitive (AAA should fail)', () => {
        expect(valid(schemaDefault, 'AAAtest')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schemaDefault, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schemaDefault, undefined)).toBe(true);
    });

    // threshold=4: numChars = 4-1 = 3 → rejects 4+ repeats
    const schema4 = Yup.string().noConsecutiveChars(4);

    it('accepts three consecutive identical chars when threshold=4', () => {
        expect(valid(schema4, 'aaabbb')).toBe(true);
    });

    it('rejects four consecutive identical chars when threshold=4', () => {
        expect(valid(schema4, 'aaaa')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// atLeastOneChar
// Regex: /(?=.*[a-z])/i — must contain at least one letter
// ---------------------------------------------------------------------------
describe('atLeastOneChar', () => {
    const schema = Yup.string().atLeastOneChar();

    it('accepts a string with letters', () => {
        expect(valid(schema, 'abc123')).toBe(true);
    });

    it('accepts a single letter', () => {
        expect(valid(schema, 'a')).toBe(true);
    });

    it('rejects a string of only digits', () => {
        expect(valid(schema, '12345')).toBe(false);
    });

    it('rejects a string of only punctuation', () => {
        expect(valid(schema, '!@#$%')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// noConsecutivePuncuation (note: intentional spelling in source)
// Regex: /([ '’\-–—])\1+/i — consecutive same punctuation chars fail
// ---------------------------------------------------------------------------
describe('noConsecutivePuncuation', () => {
    const schema = Yup.string().noConsecutivePuncuation();

    it('accepts a string with single spaces', () => {
        expect(valid(schema, 'Hello World')).toBe(true);
    });

    it('accepts a name with a single hyphen', () => {
        expect(valid(schema, 'Mary-Jane')).toBe(true);
    });

    it("accepts a name with a single apostrophe", () => {
        expect(valid(schema, "O'Brien")).toBe(true);
    });

    it('rejects double spaces', () => {
        expect(valid(schema, 'Hello  World')).toBe(false);
    });

    it('rejects double hyphens', () => {
        expect(valid(schema, 'Mary--Jane')).toBe(false);
    });

    it("rejects double apostrophes", () => {
        expect(valid(schema, "O''Brien")).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// numberWithinRange
// Uses parseFloat — accepts decimals; checks >= min AND <= max
// ---------------------------------------------------------------------------
describe('numberWithinRange', () => {
    const schema = Yup.string().numberWithinRange(1, 10);

    it('accepts a value at the lower bound', () => {
        expect(valid(schema, '1')).toBe(true);
    });

    it('accepts a value at the upper bound', () => {
        expect(valid(schema, '10')).toBe(true);
    });

    it('accepts a decimal value within range', () => {
        expect(valid(schema, '5.5')).toBe(true);
    });

    it('rejects a value below the lower bound', () => {
        expect(valid(schema, '0')).toBe(false);
    });

    it('rejects a value above the upper bound', () => {
        expect(valid(schema, '11')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
        expect(valid(schema, undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// maxLength
// ---------------------------------------------------------------------------
describe('maxLength', () => {
    const schema = Yup.string().maxLength(10);

    it('accepts a string at exactly the maximum length', () => {
        expect(valid(schema, '1234567890')).toBe(true);
    });

    it('accepts a string shorter than the maximum', () => {
        expect(valid(schema, 'hello')).toBe(true);
    });

    it('rejects a string longer than the maximum', () => {
        expect(valid(schema, '12345678901')).toBe(false);
    });

    it('passes on empty string', () => {
        expect(valid(schema, '')).toBe(true);
    });

    it('passes on undefined', () => {
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
        expect(valid(schema, 'hello')).toBe(true);
    });

    it('accepts a string with leading/trailing spaces but non-empty content', () => {
        expect(valid(schema, '  hello  ')).toBe(true);
    });

    it('rejects an empty string', () => {
        expect(valid(schema, '')).toBe(false);
    });

    it('rejects a whitespace-only string', () => {
        expect(valid(schema, '   ')).toBe(false);
    });

    it('rejects undefined', () => {
        expect(valid(schema, undefined)).toBe(false);
    });

    it('provides the correct error message when label is supplied', async () => {
        await expect(
            Yup.string().isRequired('Email').validate(undefined),
        ).rejects.toThrow('Email is required');
    });

    it('provides the path-based error message when no label is supplied', async () => {
        await expect(
            Yup.object({ myField: Yup.string().isRequired() }).validate({ myField: '' }),
        ).rejects.toThrow('is required');
    });
});
