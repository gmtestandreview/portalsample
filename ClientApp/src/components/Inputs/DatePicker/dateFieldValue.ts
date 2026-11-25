import {
  dateOnlyToPickerDate,
  dateOnlyToStoredDateTimeString,
  formatDateOnlyForDisplay,
  parseApiDateOnlyInput,
  parseDateOnlyInput,
} from '../../../utils/dateOnly';

/** What a form library may hold for a date field. */
export type DateFieldValue = string | Date | null | undefined;

/** The picker's selected date for a stored value; null when unset or unparseable. */
export const toPickerDate = (value: DateFieldValue): Date | null => {
  const dateOnlyValue = value ? parseApiDateOnlyInput(value) : null;
  return dateOnlyValue ? dateOnlyToPickerDate(dateOnlyValue) : null;
};

/**
 * The value to store for a picker change. Typed text that is not a date is kept
 * as typed; a Date that is not a date clears the field.
 */
export const toStoredDateValue = (
  update: Date | string | null,
): string | null => {
  if (update === null) {
    return null;
  }
  const dateOnlyValue = parseDateOnlyInput(update);
  if (typeof update === 'string') {
    return dateOnlyValue
      ? dateOnlyToStoredDateTimeString(dateOnlyValue)
      : update;
  }
  return dateOnlyValue ? dateOnlyToStoredDateTimeString(dateOnlyValue) : null;
};

/** True when the text left in the input differs from the stored value. */
export const hasBlurChange = (
  current: DateFieldValue,
  inputText: string,
): boolean => {
  const currentDateOnlyValue = parseDateOnlyInput(current);
  const updateDateOnlyValue = parseDateOnlyInput(inputText);
  return currentDateOnlyValue && updateDateOnlyValue
    ? currentDateOnlyValue !== updateDateOnlyValue
    : inputText !== current;
};

/** Text for a date field shown as a summary. */
export const toSummaryText = (value: DateFieldValue): string => {
  const dateOnlyValue = parseApiDateOnlyInput(value);
  return dateOnlyValue
    ? formatDateOnlyForDisplay(dateOnlyValue)
    : String(value ?? '');
};
