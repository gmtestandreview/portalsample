import type { ReactNode } from 'react';
import type { FormControlProps } from 'react-bootstrap';
import type { BsPrefixRefForwardingComponent } from 'react-bootstrap/esm/helpers';
import { NumericFormat, PatternFormat } from 'react-number-format';

export interface NumberInputProps {
    customInput?: BsPrefixRefForwardingComponent<'input', FormControlProps>;
    label?: string;
    name: string;
    inlineHelp?: string | ReactNode;
    disabled?: boolean;
    readonly?: boolean;
    id?: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    containerClassName?: string;
    className?: string;
    prepend?: string;
    append?: string;
    isValid?: boolean;
    isInvalid?: boolean;
    as?: string;
    displayType?: 'input' | 'text';
    format?: string | FormatInputValueFunction;
    mask?: string | string[];
    readOnly?: boolean;
    minLength?: number;
    maxLength?: number;
    prefix?: string;
    suffix?: string;
    thousandSeparator?: boolean | string;
    fixedDecimalScale?: boolean;
    valueIsNumericString?: boolean;
    allowNegative?: boolean;
    allowemptyformatting?: boolean;
    allowLeadingZeros?: boolean;
    renderText?: (formattedValue: string) => React.ReactNode;
    allowedDecimalSeparators?: Array<string>;
    decimalScale?: number;
    isSummary?: boolean;
    defaultValue?: number;
    role?: string;
    children?: React.ReactNode;
}

export type FormatInputValueFunction = (inputValue: string) => string;

export interface INumericFormatProps {
    customInput?: BsPrefixRefForwardingComponent<'input', FormControlProps>;
    type?: string;
    className?: string;
    isInvalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    value: unknown;
    autoComplete?: string;
    placeholder?: string;
    displayType?: 'input' | 'text';
    format?: string | FormatInputValueFunction;
    mask?: string | string[];
    minLength?: number;
    maxLength?: number;
    prefix?: string;
    suffix?: string;
    thousandSeparator?: string | boolean;
    fixedDecimalScale?: boolean;
    valueIsNumericString?: boolean;
    allowNegative?: boolean;
    allowemptyformatting?: boolean;
    allowLeadingZeros?: boolean;
    renderText?: ((formattedValue: string) => ReactNode);
    allowedDecimalSeparators?: string[];
    decimalScale?: number;
    role?: string;
    children?: React.ReactNode;
}

// This is a hacked changed to NumericFormat due to React 18
// See https://stackoverflow.com/questions/71791347/npm-package-cannot-be-used-as-a-jsx-component-type-errors
export const NumericFormatFixed = NumericFormat as unknown as React.FC<INumericFormatProps>;

export const PatternFormatFixed = PatternFormat as unknown as React.FC<INumericFormatProps>;
