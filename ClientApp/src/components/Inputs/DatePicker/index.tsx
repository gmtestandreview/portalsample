import { useField, useFormikContext } from 'formik';
import { format, parseISO } from 'date-fns';

import type React from 'react';
import { useEffect, useState } from 'react';
import { formatDateToUTC, isDateValid, parseDateUTC } from '../../../utils';
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
            const parsedDate = parseDateUTC(_field.value);
            if (parsedDate) {
                setCurrentDate(parsedDate);
            }
        }
    }, [_field.value, currentDate]);

    const dateOnChange = async (dateUpdateValue: Date | string | null) => {
        let dateString: string | null;

        if (dateUpdateValue === null) {
            dateString = null;
        } else if (typeof dateUpdateValue === 'string') {
            if (isDateValid(dateUpdateValue)) {
                dateString = formatDateToUTC(dateUpdateValue);
            } else {
                dateString = dateUpdateValue;
            }
        } else {
            dateString = formatDateToUTC(dateUpdateValue);
        }

        await setFieldValue(_field.name, dateString, true);
    };

    const dateOnBlur = async (event: React.FocusEvent) => {
        const element = (event.target as HTMLInputElement);
        const dateUpdateValue = element.value;

        if (dateUpdateValue !== _field.value) {
            await dateOnChange(dateUpdateValue || null);
        }

        setFieldTouched(_field.name);
    };

    const getDate = (date: string | Date) => (typeof date === 'string' ? parseISO(date) : date);

    if (isSummary) {
        const displayValue = _field.value ? format(getDate(_field.value), 'dd LLL yyyy') : _field.value;

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
