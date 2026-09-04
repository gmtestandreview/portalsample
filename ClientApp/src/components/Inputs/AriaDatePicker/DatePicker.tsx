'use client';
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
  Group,
  type ValidationResult,
} from 'react-aria-components/DatePicker';
import { DateInput, DateSegment } from '../AriaDateField/DateField';
import { Label, FieldError, Description } from '../../forms/AriaForm/Form';
import { FieldButton } from '../../forms/AriaForm/Form';
import { Calendar } from '../../Calendar/Calendar';
import { Popover } from '../../AriaComponents/Popover';
import { ChevronDown } from '../../AriaComponents/NmiIcon';
import './DatePicker.css';

export interface DatePickerProps<T extends DateValue> extends AriaDatePickerProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function DatePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker {...props}>
      <Label>{label}</Label>
      <Group>
        <DateInput>{(segment) => <DateSegment segment={segment} />}</DateInput>
        <FieldButton>
          <ChevronDown />
        </FieldButton>
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover hideArrow>
        <Calendar />
      </Popover>
    </AriaDatePicker>
  );
}
