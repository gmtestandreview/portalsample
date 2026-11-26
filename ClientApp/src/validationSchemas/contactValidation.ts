import * as yup from 'yup';
import type { ContactDto } from '../api/web-api-client';
import {
  NotEmpty,
  nullableString,
  requiredNullableString,
  alphaNumericSchema,
} from './common';
import addressSchema from './addressValidation';

export const titleSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(100)
    .nameAllowedFormat(false);

export const titleOtherSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .nameAllowedFormat(false)
    .maxLength(100)
    .allowedFormat(false, 'Other title', 'Please enter a valid other title');

export const nameSchema = (label: string, length: number, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(length)
    .nameAllowedFormat(false);

// Moved to common.ts
// export const alphaNumericSchema = (label: string, length: number, required = true) => (
//     (required) ? requiredNullableString(label) : nullableString(label)
// )
//     .minEntered(2)
//     .maxLength(length)
//     .matches(/^[a-zA-Z0-9\s'-]+$/, `${label} has invalid characters. Please enter only valid characters (alphabet, numbers, space, apostrophe, or hyphen)`);

export const roleSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(99)
    .allowedFormat(true);

export const companyIdentifierSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(99)
    .allowedFormat(true);

export const emailSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .maxLength(100)
    .email();

const phoneRequired =
  () => (value: string | null | undefined, context: yup.TestContext) =>
    NotEmpty(value) ||
    (context.parent as ContactDto).mobile?.length !== 0 ||
    (context.parent as ContactDto).phone?.length !== 0;

export const phoneSchema = (
  label: string,
  required = true,
  message = 'Please enter a valid Business phone',
) =>
  nullableString(label)
    .minEntered(6)
    .maxLength(12)
    .phone(false, undefined, message)
    .test(
      'Please provide at least one phone number.',
      `${label} is required`,
      required ? phoneRequired() : () => true,
    );

export const phoneRequiredSchema = (
  label: string,
  message = 'Please enter a valid Business phone',
) =>
  nullableString(label)
    .minEntered(6)
    .maxLength(12)
    .phone(false, undefined, message)
    .required(`${label} is required`);

export const abnRequiredSchema = (
  label: string,
  message = 'Please enter a valid ABN',
) =>
  nullableString(label)
    // .minEntered(11)
    // .maxLength(11)
    .length(14, `${label} must be 11 digits`)
    .required(`${label} is required`);

export const mobileSchema = (label: string, required = true) =>
  nullableString(label)
    .minEntered(10)
    .maxLength(12)
    .phone(true, undefined, 'Please enter a valid Mobile phone')
    .test(
      'Please provide at least one phone number.',
      `${label} is required`,
      required ? phoneRequired() : () => true,
    );

export const contactSchema = () =>
  yup.object({
    title: titleSchema('Title', false),
    titleOther: titleOtherSchema('Title other'),
    firstName: nameSchema('First name', 50),
    lastName: nameSchema('Last name', 99),
    role: roleSchema('Role', false),
    phone: phoneSchema('Business phone'),
    mobile: mobileSchema('Mobile phone'),
    email: emailSchema('Email address'),
  });

export const authorisedAgentSchema = () =>
  yup.object({
    // manufacturerName: nameSchema('Manufacturer name', 100),
    manufacturerName: alphaNumericSchema('Manufacturer name', 100),
    // companyIdentifier: nameSchema('Company identifier', 100),
    abn: abnRequiredSchema('Company identifier'),
    streetAddress: addressSchema('Street address'),
  });

export const authorisedAgentSchemaSoft = () =>
  yup.object({
    // manufacturerName: nameSchema('Manufacturer name', 100, false),
    manufacturerName: yup
      .string()
      .label('Manufacturer name')
      .nullable()
      .max(100),
    // companyIdentifier: nameSchema('Company identifier', 100, false),
    // address schema is not used for soft validations
  });

export const contactSchemaSoft = () =>
  yup.object({
    title: titleSchema('Title', false),
    titleOther: titleOtherSchema('Title other', false),
    firstName: nameSchema('First name', 50, false),
    lastName: nameSchema('Last name', 99, false),
    role: roleSchema('Role', false),
    phone: phoneSchema('Business phone', false),
    mobile: mobileSchema('Mobile phone', false),
    email: emailSchema('Email address', false),
  });

export const contactSchemaEmailOnly = () =>
  yup.object({
    title: titleSchema('Title', false),
    titleOther: titleOtherSchema('Title other', false),
    firstName: nameSchema('First name', 50, false),
    lastName: nameSchema('Last name', 99, false),
    role: roleSchema('Role', false),
    phone: phoneSchema('Business phone', false),
    mobile: mobileSchema('Mobile phone', false),
    email: emailSchema('Email address'),
  });

export const contactSchemaLastNameEmailOnly = () =>
  yup.object({
    title: titleSchema('Title', false),
    titleOther: titleOtherSchema('Title other', false),
    firstName: nameSchema('First name', 50, false),
    lastName: nameSchema('Last name', 99),
    role: roleSchema('Role', false),
    phone: phoneSchema('Business phone', false),
    mobile: mobileSchema('Mobile phone', false),
    email: emailSchema('Email address'),
  });
