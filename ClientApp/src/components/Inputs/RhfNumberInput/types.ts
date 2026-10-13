import type { ReactNode } from 'react';
import type { FormatInputValueFunction } from '../NumberInput/types';

/**
 * Props for the React Hook Form formatted number / phone box. Only what the
 * first RHF consumers use (acceptQuote delivery and return, ContactDetails)
 * is supported. These legacy `NumberInput` props are deferred to their first
 * RHF consumer: `type` (only changes behaviour for 'date'), `autoComplete`,
 * `append`, `as`, `displayType`, `mask`, `minLength`, `prefix`, `suffix`,
 * `allowemptyformatting`, `allowLeadingZeros`, `renderText`,
 * `allowedDecimalSeparators`, and `defaultValue`.
 */
export interface RhfNumberInputProps {
  label?: string | undefined;
  name: string;
  inlineHelp?: ReactNode;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  id?: string | undefined;
  placeholder?: string | undefined;
  containerClassName?: string | undefined;
  className?: string | undefined;
  prepend?: string | undefined;
  /** A pattern such as `#### ### ###`, a function, or `checkPhoneFormat`. */
  format?: string | FormatInputValueFunction | undefined;
  maxLength?: number | undefined;
  thousandSeparator?: boolean | string | undefined;
  fixedDecimalScale?: boolean | undefined;
  decimalScale?: number | undefined;
  valueIsNumericString?: boolean | undefined;
  allowNegative?: boolean | undefined;
  supressFieldLevelMessages?: boolean | undefined;
  isSummary?: boolean | undefined;
}
