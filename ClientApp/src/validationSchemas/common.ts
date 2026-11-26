/* eslint-disable no-useless-escape */
import { isEmpty, trim } from 'lodash';
import * as yup from 'yup';
import { DateTime } from 'luxon';
import { containsWhitespace, parseDate } from '../utils';

// export const companyDetailsRequiredSchema = (): yup.SchemaOf<CompanyDetailsDto> => yup.object({
//     abn: yup.string().label('ABN'),
//     name: yup.string().label('Entity name'),
//     acn: yup.string().label('ACN'),
//     searchText: yup.mixed()
//         .when(['abn'], {
//             is: (abn: string) => !abn,
//             then: yup.string()
//                 .required('Search for an ABN is required')
//                 .test('length', 'You must have a valid ABN to continue', (val) => {
//                     const lengthWithoutSpaces = val?.replace(/ /g, '').length;
//                     return lengthWithoutSpaces === 11;
//                 })
//                 .oneOf([yup.ref('abn')], 'Please search to continue'),
//         }),
// });

export const NotEmpty = (value: string | undefined | null) =>
  value !== undefined && value !== null && !isEmpty(trim(value));

export const IsEmpty = (value: string | undefined | null) =>
  value === undefined || value === null || isEmpty(trim(value));

export const isEmptyDate = (value: Date | {} | string | null | undefined) => {
  if (value === undefined || value === null || value.toString().trim() === '') {
    return true;
  }

  return false;
};

const isValidDate = (value: Date | {} | string | null | undefined) => {
  if (isEmptyDate(value)) {
    return true;
  }

  const parsedDate = parseDate(value! as Date);

  if (parsedDate) {
    return parsedDate <= new Date(9999, 12, 31);
  }

  return false;
};

export const nullableString = (label: string) =>
  yup
    .string()
    .transform((value: unknown) =>
      typeof value === 'string' ? value.trim() : '',
    )
    .default('')
    .label(label);

export const requiredNullableString = (label: string) =>
  yup
    .string()
    // eslint-disable-next-line
    .transform((value: any) => (typeof value === 'string' ? value.trim() : ''))
    .required(`${label} is required`)
    .default('')
    .label(label)
    .nullable();

const isDate = () => (value: Date | undefined) => isValidDate(value);

export const requiredNullableDate = (label: string) =>
  yup
    .mixed()
    .test(
      'must be a valid date',
      'The date entered must be a valid date in DD/MM/YYYY format.',
      isDate() as any, // Added "as any". TODO: review
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
      isDate() as any, // Added "as any". TODO: review
    )
    .transform((value: Date) => (isEmptyDate(value) ? undefined : value))
    .label(label)
    .nullable();

// export const isLaterThan = (compareDate: Date | string) => (value: Date | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const minimumDate = luxon(compareDate).startOf('day').toDate();
//     const inputDate = luxon(value).startOf('day').toDate();
//     return inputDate > minimumDate;
// };

// export const isOnOrLaterThan = (compareDate: Date | string) => (value: Date | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const minimumDate = moment(compareDate).startOf('day').toDate();
//     const inputDate = moment(value).startOf('day').toDate();
//     return inputDate >= minimumDate;
// };

export const oneOfEnum = <T extends {}>(
  enumObject: Record<string, T> | ArrayLike<T>,
) => yup.mixed<T>().oneOf(Object.values(enumObject));

export const isFutureDate = () => (value: Date | {} | null | undefined) => {
  if (isEmptyDate(value) || !isValidDate(value)) {
    return true;
  }

  const dateValue = DateTime.fromJSDate(value!).toJSDate();
  const startOfDayValue = DateTime.now().startOf('day').toJSDate();

  if (dateValue && dateValue !== null) {
    return dateValue > startOfDayValue;
  }

  return true;
};

// export const isTodayOrFutureDate = () => (value: Date | string | null | undefined) => {
//     if (isEmptyDate(value) || !isValidDate(value)) {
//         return true;
//     }

//     const dateValue = moment(value).toDate();
//     const startOfDayValue = moment().startOf('day').toDate();

//     if (dateValue && dateValue !== null) {
//         return dateValue >= startOfDayValue;
//     }

//     return true;
// };

// Field-level REGEX for various validation patterns
export const urlMatchRegex =
  /^(?![\.])(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)(?<![\.])$/;
export const serialNumMatchRegEx =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]]+$/;

// Global REGEX re-usable patterns for validations
export const alphaNumericRegEx = /^[a-zA-Z0-9\s'-]+$/;
export const extAlphaNumSingleLineMatchRegex =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]]+$/;
export const extAlphaNumMultiLineMatchRegex =
  /^[0-9A-Za-z#'\-. $%!&?+:,/()@=^~*_`"{}\[\]<>\r\n]+$/;
// export const safeCharacterRegex =          /^[a-zA-Z0-9\s.,'"\-+*/=^%(){}\[\]<>]*$/;

export const alphaNumericSchema = (
  label: string,
  length: number,
  required: boolean | undefined = true,
) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(length)
    .matches(alphaNumericRegEx, {
      message: `${label} has invalid characters. Please enter only valid characters (alphabet, numbers, space, apostrophe, or hyphen)`,
      excludeEmptyString: !required,
    });

export const extAlphaNumericSchema = (
  label: string,
  length: number,
  required: boolean | undefined = true,
) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(length)
    .matches(extAlphaNumSingleLineMatchRegex, {
      message: `${label} has invalid characters. Please enter only valid characters (alphabet, numbers, space, apostrophe, or hyphen)`,
      excludeEmptyString: !required,
    });

export const extAlphaNumericMultiLineSchema = (
  label: string,
  length: number,
  required: boolean | undefined = true,
) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .minEntered(2)
    .maxLength(length)
    .matches(extAlphaNumMultiLineMatchRegex, {
      message: `${label} has invalid characters. Please enter only valid characters (alphabet, numbers, space, apostrophe, or hyphen)`,
      excludeEmptyString: !required,
    });

export const websiteUrlSchema = (message: string, excludeEmpty = true) =>
  yup.string().matches(urlMatchRegex, {
    message,
    excludeEmptyString: excludeEmpty,
  });

export const emailSchema = (label: string, required = true) =>
  (required ? requiredNullableString(label) : nullableString(label))
    .maxLength(100)
    .email();

const abnWeights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export const isValidAbn = (value: string) => {
  let sum = 0;

  if (value.length !== 11 || containsWhitespace(value)) {
    return false;
  }

  for (let index = 0; index < abnWeights.length; index++) {
    const weight = abnWeights[index];
    const digit =
      Number.parseInt(value.substring(index, index + 1), 10) -
      (index === 0 ? 1 : 0);
    sum += weight * digit;
  }

  return sum % 89 === 0;
};

export const numberToText = (digits: number) =>
  digits === 1
    ? 'one'
    : digits === 2
      ? 'two'
      : digits === 3
        ? 'three'
        : digits === 4
          ? 'four'
          : digits === 5
            ? 'five'
            : digits === 6
              ? 'six'
              : digits === 7
                ? 'seven'
                : digits === 8
                  ? 'eight'
                  : digits === 9
                    ? 'nine'
                    : digits === 10
                      ? 'ten'
                      : `${digits}`;
