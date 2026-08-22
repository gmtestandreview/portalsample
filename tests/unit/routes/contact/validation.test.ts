import { describe, expect, it } from 'vitest';
import '../../../../ClientApp/src/validationSchemas/yupExtensions';
import contactSubmitValidation from '../../../../ClientApp/src/routes/contact/validation';

const validContact = {
    title: '',
    titleOther: 'Mx',
    firstName: 'Alex',
    lastName: 'Citizen',
    role: '',
    phone: '0212345678',
    mobile: '',
    email: 'alex@example.com',
};

describe('contactSubmitValidation', () => {
    it('accepts a valid contact object', async () => {
        await expect(contactSubmitValidation.validate({ contact: validContact })).resolves.toMatchObject({ contact: validContact });
    });

    it('requires missing hard contact fields', async () => {
        await expect(contactSubmitValidation.validate({ contact: {} }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Title other is required',
                'First name is required',
                'Last name is required',
                'Business phone is required',
                'Mobile phone is required',
                'Email address is required',
            ]),
        });
    });

    it('validates invalid formats', async () => {
        await expect(contactSubmitValidation.validate({
            contact: {
                ...validContact,
                firstName: 'A',
                lastName: 'B',
                phone: 'bad',
                email: 'bad',
            },
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'First name cannot be less than 2 characters',
                'Last name cannot be less than 2 characters',
                'Please enter a valid Business phone',
                'Email address is not a valid email address',
            ]),
        });
    });

    it('accepts max length boundaries', async () => {
        await expect(contactSubmitValidation.validate({
            contact: {
                ...validContact,
                titleOther: 'a'.repeat(100),
                firstName: 'b'.repeat(50),
                lastName: 'c'.repeat(99),
                role: 'd'.repeat(99),
            },
        })).resolves.toBeDefined();
    });

    it('rejects values over max length boundaries', async () => {
        await expect(contactSubmitValidation.validate({
            contact: {
                ...validContact,
                titleOther: 'a'.repeat(101),
                firstName: 'b'.repeat(51),
                lastName: 'c'.repeat(100),
                role: 'd'.repeat(100),
                email: `${'e'.repeat(95)}@example.com`,
            },
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Title other cannot be greater than 100 characters',
                'First name cannot be greater than 50 characters',
                'Last name cannot be greater than 99 characters',
                'Role cannot be greater than 99 characters',
                'Email address cannot be greater than 100 characters',
            ]),
        });
    });
});
