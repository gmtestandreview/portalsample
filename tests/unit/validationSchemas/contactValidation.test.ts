import { describe, expect, it } from 'vitest';
import '../../../ClientApp/src/validationSchemas/yupExtensions';
import {
    contactSchema,
    contactSchemaEmailOnly,
    contactSchemaSoft,
    emailSchema,
    mobileSchema,
    nameSchema,
    phoneRequiredSchema,
    phoneSchema,
    roleSchema,
    titleOtherSchema,
    titleSchema,
} from '../../../ClientApp/src/validationSchemas/contactValidation';

const validContact = {
    title: 'Dr',
    titleOther: 'Mx',
    firstName: 'Alex',
    lastName: 'Citizen',
    role: 'Manager',
    phone: '0212345678',
    mobile: '',
    email: 'alex@example.com',
};

describe('contact validation field schemas', () => {
    it('validates required and optional title fields', async () => {
        await expect(titleSchema('Title').validate('Dr')).resolves.toBe('Dr');
        await expect(titleSchema('Title').validate('D')).rejects.toThrow('Title cannot be less than 2 characters');
        await expect(titleSchema('Title').validate('')).rejects.toThrow('Title is required');
        await expect(titleSchema('Title', false).validate('')).resolves.toBe('');
        await expect(titleOtherSchema('Other title').validate('A@', { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Other title has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen',
                'Please enter a valid other title',
            ]),
        });
    });

    it('validates required and optional name and role fields', async () => {
        await expect(nameSchema('First name', 5).validate('Alex')).resolves.toBe('Alex');
        await expect(nameSchema('First name', 5).validate('A')).rejects.toThrow('First name cannot be less than 2 characters');
        await expect(nameSchema('First name', 5).validate('abcdef')).rejects.toThrow('First name cannot be greater than 5 characters');
        await expect(nameSchema('First name', 5, false).validate('')).resolves.toBe('');
        await expect(roleSchema('Role').validate('QA lead')).resolves.toBe('QA lead');
        await expect(roleSchema('Role', false).validate('')).resolves.toBe('');
    });

    it('validates phone, mobile, and email fields', async () => {
        await expect(phoneRequiredSchema('Business phone').validate('0212345678')).resolves.toBe('0212345678');
        await expect(phoneRequiredSchema('Business phone').validate('')).rejects.toThrow('Business phone is required');
        await expect(phoneSchema('Business phone', false).validate('badbad')).rejects.toThrow('Please enter a valid Business phone');
        await expect(mobileSchema('Mobile phone', false).validate('0412345678')).resolves.toBe('0412345678');
        await expect(mobileSchema('Mobile phone', false).validate('0212345678')).rejects.toThrow('Please enter a valid Mobile phone');
        await expect(emailSchema('Email').validate('person@example.com')).resolves.toBe('person@example.com');
    });

    it('requires at least one phone number when phone schemas are required', async () => {
        const schema = contactSchema();

        await expect(schema.validate({
            ...validContact,
            phone: '',
            mobile: '',
        }, { abortEarly: false })).rejects.toMatchObject({
            errors: expect.arrayContaining([
                'Business phone is required',
                'Mobile phone is required',
            ]),
        });
        await expect(schema.validate({
            ...validContact,
            phone: '',
            mobile: '0412345678',
        })).resolves.toMatchObject({
            mobile: '0412345678',
        });
    });
});

describe('contact object schemas', () => {
    it('accepts a complete contact', async () => {
        await expect(contactSchema().validate(validContact)).resolves.toMatchObject(validContact);
    });

    it('requires hard contact fields', async () => {
        await expect(contactSchema().validate({}, { abortEarly: false })).rejects.toMatchObject({
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

    it('allows soft contact fields to be empty but validates populated formats', async () => {
        await expect(contactSchemaSoft().validate({
            title: '',
            titleOther: '',
            firstName: '',
            lastName: '',
            role: '',
            phone: '',
            mobile: '',
            email: '',
        })).resolves.toBeDefined();
        await expect(contactSchemaSoft().validate({
            email: 'invalid',
        })).rejects.toThrow('Email address is not a valid email address');
    });

    it('requires only email for email-only contact schema', async () => {
        await expect(contactSchemaEmailOnly().validate({
            email: 'billing@example.com',
        })).resolves.toMatchObject({
            email: 'billing@example.com',
        });
        await expect(contactSchemaEmailOnly().validate({
            email: '',
        })).rejects.toThrow('Email address is required');
    });
});
