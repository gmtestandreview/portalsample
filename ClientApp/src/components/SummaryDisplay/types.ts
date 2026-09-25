import type { ReactNode } from 'react';

export type SummaryFormatInputValueFunction = (inputValue: string) => string;

export interface SummaryDisplayProps {
    label?: ReactNode;
    value?: string;
    id?: string;
    descriptor?: ReactNode;
    as?: string;
    bodyText?: ReactNode;
    containerClassName?: string;
    className?: string;
    format?: string | SummaryFormatInputValueFunction;
    mask?: string | string[];
    prepend?: string;
    append?: string;
    prefix?: string;
    suffix?: string;
    thousandSeparator?: boolean | string;
    valueIsNumericString?: boolean;
    allowNegative?: boolean;
    allowemptyformatting?: boolean;
    allowLeadingZeros?: boolean;
    renderText?: (...args: any[]) => ReactNode;
    allowedDecimalSeparators?: string[];
    [key: string]: unknown;
}
