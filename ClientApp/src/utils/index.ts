/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isValid, parse } from 'date-fns';
import { enAU } from 'date-fns/locale';
import {
    entriesIn, fromPairs, isArray, isNil, isString, replace,
} from 'lodash';
import type { FilterKeys } from '../types';

const DATE_TIME_LOCALE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ssxxx';
const DATE_DDMMYYY_FORMAT = 'dd/MM/yyyy';

export const sleep = (milliseconds: number) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
});

const trimIfString = (value: unknown) => (isString(value) ? value.trim() : value);

export const removeAllWhitespaces = (value: string) => {
    const noSpaceString = replace(value, /\s+/g, '');
    return replace(noSpaceString, /\t+/g, '');
};

export const containsWhitespace = (value: string) => (/\s/).test(value);

export const removeEmptyKeys = <T extends Record<string, unknown>>(obj: T, filter?: FilterKeys): T => fromPairs(
    entriesIn(obj)
        .filter(([_, v]) => v !== null && v !== '' && v !== undefined && trimIfString(v) !== '')
        .filter((keyValue) => (filter ? filter(keyValue) : true))
        .map(([k, v]) => {
            if (isArray(v)) {
                const newValues: any[] = [];
                v.forEach((x) => {
                    if (x === Object(x)) {
                        newValues.push(removeEmptyKeys(x));
                    } else {
                        newValues.push(x);
                    }
                });
                return [k, newValues];
            }
            return [k, v === Object(v) ? removeEmptyKeys(v as Record<string, unknown>) : v];
        }),
) as T;

export const tail = <T>([_, ...rest]: T[]) => rest;
export const head = <T>([first]: T[]) => first;

export const propertyOf = <T>(name: keyof T) => name;

export function prefixedPropertyOf<T>(prefix: string) {
    return (name: keyof T) => `${prefix}.${String(propertyOf<T>(name))}`;
}

export const nullOrUndefinedToEmpty = <T extends Record<string, unknown>>(obj: T): T => fromPairs(
    entriesIn(obj)
        .map(([k, v]) => {
            if (isArray(v)) {
                const newValues: any[] = [];
                v.forEach((x) => {
                    if (x === Object(x)) {
                        newValues.push(nullOrUndefinedToEmpty(x));
                    } else {
                        newValues.push(x);
                    }
                });
                return [k, newValues];
            }

            if (v === null || v === undefined) {
                return [k, ''];
            }

            return [k, v === Object(v) ? nullOrUndefinedToEmpty(v as Record<string, unknown>) : v];
        }),
) as T;

export const parseDate = (value: Date | string): Date | undefined => {
    let parsedDate = null;

    if (isString(value)) {
        let dateFormat;
        if (value.length === 10) {
            dateFormat = DATE_DDMMYYY_FORMAT;
        } else {
            dateFormat = DATE_TIME_LOCALE_FORMAT;
        }

        parsedDate = parse(value, dateFormat, new Date(), { locale: enAU });
    } else {
        parsedDate = value;
    }

    if (isValid(parsedDate)) {
        parsedDate.setHours(0);
        parsedDate.setMinutes(0);
        parsedDate.setSeconds(0);
        parsedDate.setMilliseconds(0);

        return parsedDate;
    }

    return undefined;
};

export const parseDateWithTime = (value: Date | string): Date | undefined => {
    let parsedDate = null;

    if (isString(value)) {
        const dateFormat = value.length === 10 ? DATE_DDMMYYY_FORMAT : DATE_TIME_LOCALE_FORMAT;
        parsedDate = parse(value, dateFormat, new Date(), { locale: enAU });
    } else {
        parsedDate = value;
    }

    return isValid(parsedDate) ? parsedDate : undefined;
};

export const parseDateUTC = (value: Date | string): Date | undefined => {
    let parsedDate = null;

    if (isString(value)) {
        parsedDate = parse(value, DATE_TIME_LOCALE_FORMAT, new Date(), { locale: enAU });
    } else {
        parsedDate = value;
    }

    if (isValid(parsedDate)) {
        parsedDate.setHours(0);
        parsedDate.setMinutes(0);
        parsedDate.setSeconds(0);
        parsedDate.setMilliseconds(0);

        return parsedDate;
    }

    return undefined;
};

export const isDateValid = (value: Date | string | null | undefined): boolean => {
    if (isNil(value) || value.toString().trim() === '') {
        return false;
    }

    return isValid(parseDate(value));
};

export const formatDateToUTC = (value: Date | string | null): string | null => {
    if (value === null || !isDateValid(value)) {
        return null;
    }

    const parsedDate = parseDate(value);

    if (parsedDate) {
        return format(parsedDate, DATE_TIME_LOCALE_FORMAT, { locale: enAU });
    }

    return null;
};

export const formatDateStringToUTC = (dateStr?: string | Date) => {
    if (!dateStr) return undefined;
    const dt = new Date(dateStr);
    return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
};

export const formatBytes = (bytes: number, decimalPoints = 2) => {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const decimals = decimalPoints < 0 ? 0 : decimalPoints;
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];
    const index = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** index).toFixed(decimals))} ${sizes[index]}`;
};

export const formatDate = (
    date: Date | null | undefined,
    formatStr = 'dd MMM yyyy',
) => {
    if (date === null || date === undefined) {
        return '';
    }
    return format(date, formatStr, { locale: enAU });
};

export const formatDateToString = (value: Date | string | null | undefined, formatter = 'd MMM yyyy'): string | null => {
    if (value === null || !isDateValid(value) || value === undefined) {
        return null;
    }

    const parsedDate = parseDate(value);

    if (parsedDate) {
        return format(parsedDate, formatter, { locale: enAU });
    }

    return null;
};

export const formatDateTimeToString = (value: Date | string | null | undefined, formatter = 'd MMM yyyy h:mm a'): string | null => {
    if (value === null || value === undefined || !isDateValid(value)) {
        return null;
    }

    const parsedDate = parseDateWithTime(value);

    return parsedDate ? format(parsedDate, formatter, { locale: enAU }) : null;
};

/**
 *
 * @param period Reporting period (FY or CY), exam
 * @returns
 * full calendar year if period is CY
 * or full first year of financial period and last two digit of the second year
 * @example
 * formatReportingPeriod('FY 2021-2022') returns 2021-22
 * formatReportingPeriod('CY 2021') returns 2021
 */
export const formatReportingPeriod = (period: string) => {
    const prefix = period.split(' ')[0];
    if (prefix === 'CY') {
        return period.substring(3);
    }
    const fullFinancialYear = period.substring(3);
    return `${fullFinancialYear.substring(0, 4)}-${period.substring(period.length - 2)}`;
};

export type SplitCase = 'sentence' | 'lower' | 'upper';

export const splitPascalCase = (word: string, casing: SplitCase) => {
    const wordRegex = /($[a-z])|[A-Z][^A-Z]+/g;
    const matches = word.match(wordRegex);

    if (casing === 'lower') {
        return matches !== null
            ? matches.map((m) => m.toLowerCase()).join(' ')
            : word;
    }

    if (casing === 'sentence') {
        return matches !== null
            ? matches
                .map((m, i) => (i === 0 ? m : m.toLowerCase()))
                .join(' ')
            : word;
    }

    return matches !== null
        ? matches.join(' ')
        : word;
};

export const base64toBlob = (base64Data: string, contentType: string, sliceSizeIn?: number) => {
    const sliceSize = sliceSizeIn || 512;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i += 1) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};

export const formatCurrencyAmount = (amount: number | undefined): string | null => {
    if (amount === null || amount === undefined) {
        return null;
    }
    return amount.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD',
    });
};
