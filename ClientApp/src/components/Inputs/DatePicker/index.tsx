import { useField, useFormikContext } from 'formik';

import type React from 'react';
import { useEffect, useState } from 'react';
import {
    dateOnlyToPickerDate,
    dateOnlyToStoredDateTimeString,
    formatDateOnlyForDisplay,
    parseApiDateOnlyInput,
    parseDateOnlyInput,
} from '../../../utils/dateOnly';
import SummaryDisplay from '../../SummaryDisplay';
import CustomDatePicker from './CustomDatePicker';
import type { DatePickerProps } from './types';

const DatePicker = (datePickerProps: DatePickerProps) => {
    const {
        calendarButtonTitle,
        containerClassName,
        id,
        inlineHelp,
        isSummary,
        label,
        name,
        placeholder,
        startDate: _startDate,
        ...theRest
    } = datePickerProps;

    const [_field, _meta] = useField(name);
    const { setFieldValue, setFieldTouched } = useFormikContext();
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    useEffect(() => {
        if (!currentDate && _field.value) {
            const dateOnlyValue = parseApiDateOnlyInput(_field.value);
            if (dateOnlyValue) {
                setCurrentDate(dateOnlyToPickerDate(dateOnlyValue));
            }
        }
    }, [_field.value, currentDate]);

    const dateOnChange = async (dateUpdateValue: Date | string | null) => {
        let dateString: string | null;

        if (dateUpdateValue === null) {
            dateString = null;
        } else if (typeof dateUpdateValue === 'string') {
            const dateOnlyValue = parseDateOnlyInput(dateUpdateValue);
            dateString = dateOnlyValue ? dateOnlyToStoredDateTimeString(dateOnlyValue) : dateUpdateValue;
        } else {
            const dateOnlyValue = parseDateOnlyInput(dateUpdateValue);
            dateString = dateOnlyValue ? dateOnlyToStoredDateTimeString(dateOnlyValue) : null;
        }

        await setFieldValue(_field.name, dateString, true);
    };

    const dateOnBlur = async (event: React.FocusEvent) => {
        const element = (event.target as HTMLInputElement);
        const dateUpdateValue = element.value;
        const currentDateOnlyValue = parseDateOnlyInput(_field.value);
        const updateDateOnlyValue = parseDateOnlyInput(dateUpdateValue);
        const dateChanged = currentDateOnlyValue && updateDateOnlyValue
            ? currentDateOnlyValue !== updateDateOnlyValue
            : dateUpdateValue !== _field.value;

        if (dateChanged) {
            await dateOnChange(dateUpdateValue || null);
        }

        setFieldTouched(_field.name);
    };

    if (isSummary) {
        const dateOnlyValue = parseApiDateOnlyInput(_field.value);
        const displayValue = dateOnlyValue ? formatDateOnlyForDisplay(dateOnlyValue) : _field.value;

        return (
            <SummaryDisplay
                as='p'
                id={id || name}
                label={label}
                value={displayValue}
            />
        );
    }

    return (
        <CustomDatePicker
            {...theRest}
            calendarButtonTitle={calendarButtonTitle}
            containerClassName={`custom-date-picker-div ${containerClassName || ''}`}
            currentDate={currentDate}
            dateOnBlur={dateOnBlur}
            dateOnChange={dateOnChange}
            errorMessage={_meta.error}
            hasError={!!(_meta.touched && _meta.error)}
            id={id}
            inlineHelp={inlineHelp}
            name={name}
            label={label}
            placeholder={placeholder || 'dd/mm/yyyy'}
        />
    );
};

export default DatePicker;
