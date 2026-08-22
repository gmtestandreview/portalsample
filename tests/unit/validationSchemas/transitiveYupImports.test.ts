import { describe, it, expect } from 'vitest';

describe('Yup side-effect import — explicit import guard', () => {
    it('update/validation.ts schema validates without relying on transitive import', async () => {
        const { default: schema } = await import(
            '../../../ClientApp/src/routes/account/update/validation'
        );

        const validData = {
            businessOrTradingName: 'Acme Pty Ltd',
            branchOrLocationName: 'HQ',
            isDefaultOrganisation: true,
            businessWebsiteAddress: undefined,
            streetAddress: { isManuallyEntered: false, searchText: '1 Example St' },
            postalAddressSameAsStreetAddress: true,
            postalAddress: undefined,
        };

        await expect(schema.validate(validData)).resolves.toBeDefined();
    });

    it('addBranch/validation.ts schema validates without relying on transitive import', async () => {
        const { default: schema } = await import(
            '../../../ClientApp/src/routes/account/addBranch/validation'
        );

        const validData = {
            businessOrTradingName: 'Acme Branch',
            branchOrLocationName: 'Branch Office',
            isDefaultOrganisation: false,
            businessWebsiteAddress: undefined,
            streetAddress: { isManuallyEntered: false, searchText: '2 Branch Rd' },
            postalAddressSameAsStreetAddress: true,
            postalAddress: undefined,
        };

        await expect(schema.validate(validData)).resolves.toBeDefined();
    });
});
