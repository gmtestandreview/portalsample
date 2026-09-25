import { format } from 'date-fns';
import { enAU } from 'date-fns/locale';

export type DateOnlyValue = string & { readonly __dateOnlyValue: unique symbol };

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePrefixPattern = /^(\d{4})-(\d{2})-(\d{2})T/;
const displayDatePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const toDateOnlyValue = (year: number, month: number, day: number): DateOnlyValue | undefined => {
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        return undefined;
    }

    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}` as DateOnlyValue;
};

export const parseDateOnlyValue = (value: string): DateOnlyValue | undefined => {
    const match = dateOnlyPattern.exec(value.trim());

    if (!match) {
        return undefined;
    }

    return toDateOnlyValue(Number(match[1]), Number(match[2]), Number(match[3]));
};

export const parseDateOnlyInput = (
    value: Date | string | null | undefined,
): DateOnlyValue | undefined => {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return undefined;
        }

        return toDateOnlyValue(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }

    const trimmedValue = value.trim();
    const dateTimeMatch = dateTimePrefixPattern.exec(trimmedValue);

    if (dateTimeMatch) {
        return toDateOnlyValue(
            Number(dateTimeMatch[1]),
            Number(dateTimeMatch[2]),
            Number(dateTimeMatch[3]),
        );
    }

    const dateOnlyValue = parseDateOnlyValue(trimmedValue);

    if (dateOnlyValue) {
        return dateOnlyValue;
    }

    const displayDateMatch = displayDatePattern.exec(trimmedValue);

    if (displayDateMatch) {
        return toDateOnlyValue(
            Number(displayDateMatch[3]),
            Number(displayDateMatch[2]),
            Number(displayDateMatch[1]),
        );
    }

    return undefined;
};

export const parseApiDateOnlyInput = (
    value: Date | string | null | undefined,
): DateOnlyValue | undefined => {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return undefined;
        }

        return toDateOnlyValue(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    }

    return parseDateOnlyInput(value);
};

export const dateOnlyToPickerDate = (dateOnlyValue: DateOnlyValue): Date => {
    const [year, month, day] = dateOnlyValue.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
};

export const dateOnlyToApiDate = (dateOnlyValue: DateOnlyValue): Date => {
    const [year, month, day] = dateOnlyValue.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

export const dateOnlyToStoredDateTimeString = (dateOnlyValue: DateOnlyValue): string => (
    `${dateOnlyValue}T00:00:00+00:00`
);

export const formatDateOnlyForDisplay = (
    dateOnlyValue: DateOnlyValue,
    formatter = 'dd LLL yyyy',
): string => format(dateOnlyToPickerDate(dateOnlyValue), formatter, { locale: enAU });
