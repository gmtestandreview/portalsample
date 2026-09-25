import { describe, expect, it } from 'vitest';
import '../../../../ClientApp/src/validationSchemas/yupExtensions';
import { State } from '../../../../ClientApp/src/api/web-api-client';
import branchSubmitValidation from '../../../../ClientApp/src/routes/account/addBranch/validation';
import organisationSubmitValidation from '../../../../ClientApp/src/routes/account/update/validation';
import accountSubmitValidation from '../../../../ClientApp/src/routes/account/validation';

const validAddress = {
    isManuallyEntered: true,
    line1: '1 National Circuit',
    line2: '',
    line3: '',
    postcode: '2600',
    state: State.ACT,
    suburb: 'Barton',
    searchText: '',
};

const validAccount = {
    businessOrTradingName: 'NMI Trading',
    branchOrLocationName: 'Canberra Lab',
    isDefaultOrganisation: true,
    businessWebsiteAddress: 'https://measurement.gov.au',
    streetAddress: validAddress,
    postalAddressSameAsStreetAddress: true,
    postalAddress: undefined,
};

describe('accountSubmitValidation', () => {
    it('accepts a valid account object', async () => {
        await expect(accountSubmitValidation.validate(validAccount)).resolves.toMatchObject({
            businessOrTradingName: validAccount.businessOrTradingName,
            branchOrLocationName: validAccount.branchOrLocationName,
            businessWebsiteAddress: validAccount.businessWebsiteAddress,
            streetAddress: validAccount.streetAddress,
        });
    });

    it('validates required nested street address fields', async () => {
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            streetAddress: {
                isManuallyEntered: true,
                line1: '',
                postcode: '',
                suburb: '',
                state: undefined,
            },
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Address line 1 is required',
                'Postcode is required',
                'Suburb is required',
            ]),
        });
    });

    it('validates invalid formats', async () => {
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            businessOrTradingName: 'A',
            branchOrLocationName: 'B',
            businessWebsiteAddress: 'not a website',
            streetAddress: {
                ...validAddress,
                postcode: 'ABCD',
            },
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Business or trading name cannot be less than 2 characters',
                'Branch or location name cannot be less than 2 characters',
                'Business website address is not a valid website address',
                'Please enter a valid postcode',
            ]),
        });
    });

    it('accepts fields at max length boundaries', async () => {
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            businessOrTradingName: 'a'.repeat(160),
            branchOrLocationName: 'b'.repeat(160),
            businessWebsiteAddress: `${'a'.repeat(88)}.com`,
            streetAddress: {
                ...validAddress,
                line1: 'c'.repeat(250),
                suburb: 'd'.repeat(80),
            },
        })).resolves.toBeDefined();
    });

    it('rejects fields over max length boundaries', async () => {
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            businessOrTradingName: 'a'.repeat(161),
            branchOrLocationName: 'b'.repeat(161),
            businessWebsiteAddress: `${'a'.repeat(97)}.com`,
            streetAddress: {
                ...validAddress,
                line1: 'c'.repeat(251),
                suburb: 'd'.repeat(81),
            },
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Business or trading name cannot be greater than 160 characters',
                'Branch or location name cannot be greater than 160 characters',
                'Business website address cannot be greater than 100 characters',
                'Address line 1 cannot be greater than 250 characters',
                'Suburb cannot be greater than 80 characters',
            ]),
        });
    });

    it('requires postal address only when it differs from street address', async () => {
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            postalAddressSameAsStreetAddress: false,
            postalAddress: {
                isManuallyEntered: false,
                searchText: '',
            },
        })).rejects.toThrow('Postal address is required');
        await expect(accountSubmitValidation.validate({
            ...validAccount,
            postalAddressSameAsStreetAddress: false,
            postalAddress: validAddress,
        })).resolves.toBeDefined();
    });
});

describe('branch and organisation account validation modules', () => {
    it.each([
        ['add branch', branchSubmitValidation],
        ['update organisation', organisationSubmitValidation],
    ])('accepts a valid %s object', async (_name, schema) => {
        await expect(schema.validate(validAccount)).resolves.toMatchObject({
            businessOrTradingName: validAccount.businessOrTradingName,
            branchOrLocationName: validAccount.branchOrLocationName,
            businessWebsiteAddress: validAccount.businessWebsiteAddress,
            streetAddress: validAccount.streetAddress,
        });
    });

    it.each([
        ['add branch', branchSubmitValidation],
        ['update organisation', organisationSubmitValidation],
    ])('requires postal address for %s when it differs from street address', async (_name, schema) => {
        await expect(schema.validate({
            ...validAccount,
            postalAddressSameAsStreetAddress: false,
            postalAddress: {
                isManuallyEntered: false,
                searchText: '',
            },
        })).rejects.toThrow('Postal address is required');
    });
});
