'use client';
import {
  DateRangePicker as AriaDateRangePicker,
  type DateRangePickerProps as AriaDateRangePickerProps,
  type DateValue,
  Group,
  type ValidationResult,
} from 'react-aria-components/DateRangePicker';
import { ChevronDown } from '../../react-aria-evaluation/primitives/NmiIcon.tsx';
import { Popover } from '../../react-aria-evaluation/primitives/Popover.tsx';
import { RangeCalendar } from '../../react-aria-evaluation/primitives/RangeCalendar.tsx';
import {
  Description,
  FieldButton,
  FieldError,
  Label,
} from '../../forms/AriaForm/Form.tsx';
import { DateInput, DateSegment } from '../AriaDateField/DateField.tsx';
import './DateRangePicker.css';

export interface DateRangePickerProps<
  T extends DateValue,
> extends AriaDateRangePickerProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function DateRangePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  ...props
}: Readonly<DateRangePickerProps<T>>) {
  return (
    <AriaDateRangePicker {...props}>
      <Label>{label}</Label>
      <Group className='react-aria-Group inset'>
        <div className='date-fields'>
          <DateInput slot='start'>
            {(segment) => <DateSegment segment={segment} />}
          </DateInput>
          <span aria-hidden='true'>–</span>
          <DateInput slot='end'>
            {(segment) => <DateSegment segment={segment} />}
          </DateInput>
        </div>
        <FieldButton>
          <ChevronDown />
        </FieldButton>
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover hideArrow={true}>
        <RangeCalendar />
      </Popover>
    </AriaDateRangePicker>
  );
}
