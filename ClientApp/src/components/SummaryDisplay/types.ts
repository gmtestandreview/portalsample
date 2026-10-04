import type { ReactNode } from 'react';

export type SummaryFormatInputValueFunction = (inputValue: string) => string;

export interface SummaryDisplayProps {
  label?: ReactNode | undefined;
  value?: string | undefined;
  id?: string | undefined;
  descriptor?: ReactNode | undefined;
  as?: string | undefined;
  bodyText?: ReactNode | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  format?: string | SummaryFormatInputValueFunction | undefined;
  mask?: string | string[] | undefined;
  prepend?: string | undefined;
  append?: string | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  thousandSeparator?: boolean | string | undefined;
  valueIsNumericString?: boolean | undefined;
  allowNegative?: boolean | undefined;
  allowemptyformatting?: boolean | undefined;
  allowLeadingZeros?: boolean | undefined;
  renderText?: ((...args: any[]) => ReactNode) | undefined;
  allowedDecimalSeparators?: string[] | undefined;
  [key: string]: unknown;
}
