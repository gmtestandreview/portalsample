"use client";
import {
	DatePicker as AriaDatePicker,
	type DatePickerProps as AriaDatePickerProps,
	type DateValue,
	Group,
	type ValidationResult,
} from "react-aria-components/DatePicker";
import { ChevronDown } from "../../AriaComponents/NmiIcon.tsx";
import { Popover } from "../../AriaComponents/Popover.tsx";
import { Calendar } from "../../Calendar/Calendar.tsx";
import {
	Description,
	FieldButton,
	FieldError,
	Label,
} from "../../forms/AriaForm/Form.tsx";
import { DateInput, DateSegment } from "../AriaDateField/DateField.tsx";
import "./DatePicker.css";

export interface DatePickerProps<T extends DateValue>
	extends AriaDatePickerProps<T> {
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
			<Popover hideArrow={true}>
				<Calendar />
			</Popover>
		</AriaDatePicker>
	);
}
