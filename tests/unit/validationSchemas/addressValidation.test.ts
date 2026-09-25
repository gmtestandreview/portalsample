import { describe, expect, it } from 'vitest';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import { State } from '../../../ClientApp/src/api/web-api-client';
import addressSchema from '../../../ClientApp/src/validationSchemas/addressValidation';

const manualAddress = {
    isManuallyEntered: true,
    line1: '1 National Circuit',
    line2: 'Level 1',
    line3: 'Building A',
    postcode: '2600',
    state: State.ACT,
    suburb: 'Barton',
    searchText: '',
};

describe('addressSchema', () => {
    it('accepts a manually entered address with required fields', async () => {
        await expect(addressSchema('Street address').validate(manualAddress)).resolves.toMatchObject(manualAddress);
    });

    it('requires manual address fields when manually entered', async () => {
        await expect(addressSchema('Street address').validate({
            isManuallyEntered: true,
            line1: '',
            postcode: '',
            state: undefined,
            suburb: '',
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Address line 1 is required',
                'Postcode is required',
                'Suburb is required',
            ]),
        });
    });

    it('validates manual address formats and max lengths', async () => {
        await expect(addressSchema('Street address').validate({
            ...manualAddress,
            line1: 'a'.repeat(251),
            line2: 'b'.repeat(251),
            line3: 'c'.repeat(251),
            postcode: 'ABCD',
            suburb: 'd'.repeat(81),
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Address line 1 cannot be greater than 250 characters',
                'Address line 2 cannot be greater than 250 characters',
                'Address line 3 cannot be greater than 250 characters',
                'Please enter a valid postcode',
                'Suburb cannot be greater than 80 characters',
            ]),
        });
    });

    it('requires search text when address is not manually entered', async () => {
        await expect(addressSchema('Postal address').validate({
            isManuallyEntered: false,
            searchText: '',
        })).rejects.toThrow('Postal address is required');
    });

    it('does not require manual fields when using searched address text', async () => {
        await expect(addressSchema('Postal address').validate({
            isManuallyEntered: false,
            line1: '',
            postcode: '',
            suburb: '',
            searchText: '1 National Circuit Barton ACT 2600',
        })).resolves.toMatchObject({
            searchText: '1 National Circuit Barton ACT 2600',
        });
    });
});
