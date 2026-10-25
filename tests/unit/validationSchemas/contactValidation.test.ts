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
    expect.assertions(5);
    await expect(titleSchema('Title').validate('Dr')).resolves.toBe('Dr');
    await expect(titleSchema('Title').validate('D')).rejects.toThrow(
      'Title cannot be less than 2 characters',
    );
    await expect(titleSchema('Title').validate('')).rejects.toThrow(
      'Title is required',
    );
    await expect(titleSchema('Title', false).validate('')).resolves.toBe('');
    await expect(
      titleOtherSchema('Other title').validate('A@', { abortEarly: false }),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([
        'Other title has invalid characters. Please enter only valid characters, such as alphabet, space, apostrophe, or hyphen',
        'Please enter a valid other title',
      ]),
    });
  });
});
