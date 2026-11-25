import type React from 'react';
import { useMemo } from 'react';
import SummaryDisplay from '../../SummaryDisplay';
import CustomDatePicker from '../DatePicker/CustomDatePicker';
import type { DatePickerProps } from '../DatePicker/types';
import {
  hasBlurChange,
  toPickerDate,
  toStoredDateValue,
  toSummaryText,
} from '../DatePicker/dateFieldValue';
import type { DateFieldValue } from '../DatePicker/dateFieldValue';
import { omitKeys } from '../../../utils/omitKeys';
import { omitUndefined } from '../../../utils/omitUndefined';
import { useRhfFieldA11y } from '../useRhfFieldA11y';

/**
 * React Hook Form counterpart of `DatePicker`. It reads the form through
 * `useController`, so it must render inside a `FormProvider`. It stores the same
 * value as the Formik picker: a `yyyy-MM-ddT00:00:00+00:00` string, `null` when
 * cleared, or the typed text when it is not a date. Calendar picks store at once;
 * text typed in the box is stored when focus leaves it, and the field is touched
 * then.
 */
const RhfDatePicker = (datePickerProps: Readonly<DatePickerProps>) => {
  const {
    calendarButtonTitle,
    containerClassName,
    id,
    inlineHelp,
    isSummary,
    label,
    name,
    placeholder,
    ...remainingProps
  } = datePickerProps;

  // `startDate` is accepted for API compatibility; the value comes from the field.
  const theRest = omitKeys(remainingProps, 'startDate');

  const { fieldValue, onFieldChange, onFieldBlur, controlId, errorMessage } =
    useRhfFieldA11y({ name, id, inlineHelp });
  const value = fieldValue as DateFieldValue;
  const currentDate = useMemo(() => toPickerDate(value), [value]);

  const dateOnChange = (dateUpdateValue: Date | string | null) => {
    onFieldChange(toStoredDateValue(dateUpdateValue));
  };

  const dateOnBlur = (event: React.FocusEvent) => {
    const { value: text } = event.target as HTMLInputElement;
    if (hasBlurChange(value, text)) {
      dateOnChange(text || null);
    }
    onFieldBlur();
  };

  if (isSummary) {
    return (
      <SummaryDisplay
        as='p'
        id={controlId}
        label={label}
        value={toSummaryText(value)}
      />
    );
  }

  return (
    <CustomDatePicker
      {...theRest}
      {...omitUndefined({
        calendarButtonTitle,
        errorMessage,
        id,
        inlineHelp,
        label,
      })}
      containerClassName={`custom-date-picker-div ${containerClassName ?? ''}`}
      currentDate={currentDate}
      dateOnBlur={dateOnBlur}
      dateOnChange={dateOnChange}
      hasError={!!errorMessage}
      name={name}
      placeholder={placeholder ?? 'dd/mm/yyyy'}
    />
  );
};

export default RhfDatePicker;
