import { describe, expect, it } from 'vitest';
import { getPhoneNumberFormat } from '@/components/Inputs/NumberInput/phoneFormat';

describe('getPhoneNumberFormat', () => {
    it.each([
        ['0412345678', '#### ### ###'],
        ['1800123456', '#### ### ###'],
        ['1300123456', '#### ### ###'],
        ['131234', '## ## ##'],
        ['1312345', '## #### ####'],
        ['0212345678', '## #### ####'],
        ['04 1234 5678', '#### ### ###'],
        [undefined, '## #### ####'],
        [null, '## #### ####'],
    ])('returns %s => %s', (value, expected) => {
        expect(getPhoneNumberFormat(value)).toBe(expected);
    });
});
