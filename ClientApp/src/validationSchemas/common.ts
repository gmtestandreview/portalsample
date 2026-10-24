/* eslint-disable no-useless-escape */
import './yupExtensions';
import * as yup from 'yup';
import { isAfter, startOfDay } from 'date-fns';
import { containsWhitespace, parseDate } from '../utils';
export { IsEmpty, NotEmpty } from './stringPredicates';

export const isEmptyDate = (value: unknown) => {
  if (value === undefined || value === null) {
    return true;
  }

  return typeof value === 'string' && value.trim() === '';
};

const isParsableDateValue = (value: unknown): value is Date | string =>
  value instanceof Date || typeof value === 'string';

const isValidDate = (value: unknown) => {
  if (isEmptyDate(value)) {
    return true;
  }

  if (!isParsableDateValue(value)) {
    return false;
  }

  const parsedDate = parseDate(value);

  if (parsedDate) {
    return parsedDate <= new Date(9999, 12, 31);
  }

  return false;
};

export const nullableString = (label: string) =>
  yup
    .string()
    .transform((value: unknown) =>
      typeof value === 'string' ? value.trim() : ''
    )
    .default('')
    .label(label);

export const requiredNullableString = (label: string) =>
  yup
    .string()
    .transform((value: any) => (typeof value === 'string' ? value.trim() : ''))
    .required(`${label} is required`)
    .default('')
    .label(label)
    .nullable();

const isDate = () => (value: unknown) => isValidDate(value);

export const requiredNullableDate = (label: string) =>
  yup
    .mixed()
    .test(
      'must be a valid date',
      'The date entered must be a valid date in DD/MM/YYYY format.',
      isDate()
    )
    .transform((value: Date) => (isEmptyDate(value) ? undefined : value))
    .required(`${label} is required`)
    .label(label)
    .nullable();

export const nullableDate = (label: string) =>
  yup
    .mixed()
    .test(
      'must be a valid date',
      'The date entered must be a valid date in DD/MM/YYYY format.',
      isDate()
    )
    .transform((value: Date) => (isEmptyDate(value) ? undefined : value))
    .label(label)
    .nullable();

export const oneOfEnum = <T extends NonNullable<unknown>>(
  enumObject: { [s: string]: T } | ArrayLike<T>
) => yup.mixed<T>().oneOf(Object.values(enumObject));

export const isFutureDate =
  () => (value: Date | string | object | null | undefined) => {
    if (isEmptyDate(value) || !isValidDate(value)) {
      return true;
    }

    const dateValue = parseDate(value as Date | string);
    const startOfDayValue = startOfDay(new Date());

    return isAfter(dateValue!, startOfDayValue);
  };

const URL_HOST_PREFIX = /^[-a-zA-Z0-9@:%._+~#=]{2,256}$/;
const URL_PATH = /^[-a-zA-Z0-9@:%_+.~#?&/=]*$/;
const URL_TLD = /^[a-z]{2,6}$/;

const isValidWebsiteUrl = (value: string): boolean => {
  if (value.startsWith('.') || value.endsWith('.')) {
    return false;
  }

  let remainder = value;
  if (remainder.startsWith('http://')) {
    remainder = remainder.slice('http://'.length);
  } else if (remainder.startsWith('https://')) {
    remainder = remainder.slice('https://'.length);
  }
  if (remainder.startsWith('www.')) {
    remainder = remainder.slice('www.'.length);
  }

  const pathStart = remainder.search(/[/?&]/);
  const host = pathStart === -1 ? remainder : remainder.slice(0, pathStart);
  const path = pathStart === -1 ? '' : remainder.slice(pathStart);
  const lastDot = host.lastIndexOf('.');
  const hostPrefix = host.slice(0, lastDot);
  const tld = host.slice(lastDot + 1);

  return (
    lastDot >= 0 &&
    URL_HOST_PREFIX.test(hostPrefix) &&
    URL_TLD.test(tld) &&
    URL_PATH.test(path)
  );
};

// To do - Explore create new Schema or stringExtensions Methods to support this
export const serialNumMatchRegEx =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]]+$/;
export const extAlphaNumSingleLineMatchRegex =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]]+$/;
export const extAlphaNumMultiLineMatchRegex =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]<>\r\n]+$/;

export const websiteUrlSchema = (message: string, excludeEmpty = true) =>
  yup.string().test('websiteUrl', message, (value) => {
    if (value === undefined || (excludeEmpty && value === '')) {
      return true;
    }
    return typeof value === 'string' && isValidWebsiteUrl(value);
  });

export const emailSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .maxLength(100)
    .email();

const abnWeights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export const isValidAbn = (value: string) => {
  if (value.length !== 11 || containsWhitespace(value)) {
    return false;
  }

  const sum = abnWeights.reduce((total, weight, index) => {
    const digit =
      Number.parseInt(value.substring(index, index + 1), 10) -
      (index === 0 ? 1 : 0);
    return total + weight * digit;
  }, 0);

  return sum % 89 === 0;
};

const DIGIT_WORDS: Readonly<Record<number, string>> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};
export const numberToText = (digits: number): string =>
  (Reflect.get(DIGIT_WORDS, digits) as string | undefined) ?? `${digits}`;
