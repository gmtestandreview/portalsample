import { useField, useFormikContext } from 'formik';

import type React from 'react';
import { useMemo } from 'react';
import SummaryDisplay from '../../SummaryDisplay';
import CustomDatePicker from './CustomDatePicker';
import type { DatePickerProps } from './types';
import { omitUndefined } from '../../../utils/omitUndefined';
import { omitKeys } from '../../../utils/omitKeys';
import { getControlId } from '../getControlId';
import {
  hasBlurChange,
  toPickerDate,
  toStoredDateValue,
  toSummaryText,
} from './dateFieldValue';
import type { DateFieldValue } from './dateFieldValue';

const DatePicker = (datePickerProps: Readonly<DatePickerProps>) => {
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

  // `startDate` is accepted for API compatibility but is not forwarded to `CustomDatePicker`;
  // the current value comes from the Formik field instead.
  const theRest = omitKeys(remainingProps, 'startDate');

  const [_field, _meta] = useField<DateFieldValue>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const currentDate = useMemo(() => toPickerDate(_field.value), [_field.value]);

  const dateOnChange = async (dateUpdateValue: Date | string | null) => {
    await setFieldValue(_field.name, toStoredDateValue(dateUpdateValue), true);
  };

  const dateOnBlur = async (event: React.FocusEvent) => {
    const element = event.target as HTMLInputElement;
    const dateUpdateValue = element.value;

    if (hasBlurChange(_field.value, dateUpdateValue)) {
      await dateOnChange(dateUpdateValue || null);
    }

    await setFieldTouched(_field.name);
  };

  if (isSummary) {
    return (
      <SummaryDisplay
        as='p'
        id={getControlId(id, name)}
        label={label}
        value={toSummaryText(_field.value)}
      />
    );
  }

  return (
    <CustomDatePicker
      {...theRest}
      {...omitUndefined({
        calendarButtonTitle,
        errorMessage: _meta.error,
        id,
        inlineHelp,
        label,
      })}
      containerClassName={`custom-date-picker-div ${containerClassName ?? ''}`}
      currentDate={currentDate}
      dateOnBlur={(event) => {
        void dateOnBlur(event);
      }}
      dateOnChange={dateOnChange}
      hasError={!!(_meta.touched && _meta.error)}
      name={name}
      placeholder={placeholder ?? 'dd/mm/yyyy'}
    />
  );
};

export default DatePicker;
