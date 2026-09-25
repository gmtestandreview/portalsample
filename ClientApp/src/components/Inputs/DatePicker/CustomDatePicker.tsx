import type { Placement } from '@popperjs/core';
import { enAU } from 'date-fns/locale';
import React, { useEffect, useRef, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import SecondaryButton from '../../Buttons/SecondaryButton';
import CustomDateInput from './CustomDateInput';
import type { CustomDatePickerProps } from './types';

const DATE_INPUT_FORMAT = 'dd/MM/yyyy';

const CustomDatePicker = (customDatePickerProps: CustomDatePickerProps) => {
    const {
        calendarButtonTitle,
        containerClassName,
        currentDate,
        dateOnBlur,
        dateOnChange,
        disabled,
        errorMessage,
        hasError,
        inlineHelp,
        label,
        maxDate,
        minDate,
        name,
        placeholder,
        readOnly,
        startDate,
    } = customDatePickerProps;

    const [showCalendar, setShowCalendar] = useState(false);
    const [isInvalid, setIsInvalid] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(currentDate || startDate || null);

    // Impure during render: the argument is re-evaluated every render even though
    // only the first value is kept. Replacing it (useId) changes the generated id,
    // which Child Plan B's DatePicker characterization asserts against, so it is
    // deferred to that plan rather than changed in a lint migration.
    // eslint-disable-next-line @eslint-react/purity
    const wrapperUUID = useRef(crypto.randomUUID());

    const customInputControlRef = useRef<HTMLInputElement>(null);
    const customInputInlineHelpRef = useRef<HTMLDivElement>(null);
    const customInputFeedbackRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<ReactDatePicker | null>(null);

    useEffect(() => {
        setSelectedDate(currentDate ?? null);
    }, [currentDate]);

    const showCalendarInvalid = hasError || isInvalid;

    const handleOpenCalendar = () => {
        setShowCalendar(true);

        // react-datepicker does not expose this state through its TypeScript API.
        (datePickerRef.current as any).state.open = true;
    };

    const handleEnsureCalendarClosed = () => {
        // react-datepicker does not expose this state through its TypeScript API.
        (datePickerRef.current as any).state.open = false;
    };

    const handleCloseCalendar = () => {
        setShowCalendar(false);
        handleEnsureCalendarClosed();

        customInputControlRef?.current?.focus();
    };

    const handleOnChange = (date: Date | null) => {
        dateOnChange(date);
        setSelectedDate(date);
        handleCloseCalendar();

        setIsInvalid(!customInputControlRef?.current?.checkValidity());
    };

    const handleSelectToday = () => {
        handleOnChange(new Date());
        handleCloseCalendar();
    };

    const handleOnBlur = (event: React.FocusEvent) => {
        dateOnBlur(event);
    };

    const handleCalendarButtonKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleCloseCalendar();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (!readOnly || disabled) {
                handleOpenCalendar();
            }
        } else {
            handleCalendarButtonKeyDown(event);
        }
    };

    const offSetModifier = React.useMemo(() => ({
        name: 'offset',
        options: {
            offset: (offsetArgs: { placement: Placement }) => {
                let bottomOffset = -53;
                let topOffset = -48;
                let distanceOffset = 0;

                if (isInvalid) {
                    bottomOffset += 4;
                    topOffset += 3;
                }

                if (offsetArgs.placement.includes('bottom')) {
                    const invalidInputRef = customInputControlRef?.current?.classList.contains('is-invalid');
                    if (invalidInputRef) {
                        const inputErrorClientHeight = customInputFeedbackRef?.current?.clientHeight || 0;

                        distanceOffset = bottomOffset - inputErrorClientHeight;
                    } else {
                        distanceOffset = bottomOffset;
                    }
                } else if (offsetArgs.placement.includes('top')) {
                    const inlineHelpClientHeight = customInputInlineHelpRef?.current?.clientHeight || 0;

                    distanceOffset = topOffset - inlineHelpClientHeight;
                }

                return [0, distanceOffset];
            },
        },
    }), [isInvalid]);

    const CustomInput = (
        <CustomDateInput
            calendarButtonTitle={calendarButtonTitle ?? ''}
            calendarOnKeyDown={handleCalendarButtonKeyDown}
            containerClassName={containerClassName}
            errorMessage={errorMessage}
            inlineHelp={inlineHelp}
            label={label}
            name={name}
            handleCloseCalendar={handleCloseCalendar}
            handleEnsureCalendarClosed={handleEnsureCalendarClosed}
            handleOpenCalendar={handleOpenCalendar}
            hasError={hasError}
            forwardedControlRef={customInputControlRef}
            forwardedInlineHelpRef={customInputInlineHelpRef}
            forwardedFeedbackRef={customInputFeedbackRef}
            wrapperUUID={wrapperUUID.current}
        />
    );

    return (
        <div id={wrapperUUID.current}>
            <ReactDatePicker
                autoComplete='off'
                calendarClassName={`custom-date-picker-calendar ${showCalendarInvalid ? 'custom-calendar-focus' : ''}`}
                customInput={CustomInput}
                dateFormat={DATE_INPUT_FORMAT}
                disabled={disabled}
                // eslint-disable-next-line @eslint-react/purity -- "today" semantics; owned by Child Plan B
                highlightDates={[new Date()]}
                locale={enAU}
                name={name}
                maxDate={maxDate}
                minDate={minDate}
                onBlur={handleOnBlur}
                onChange={handleOnChange}
                onClickOutside={handleCloseCalendar}
                onKeyDown={handleKeyDown}
                open={showCalendar}
                // eslint-disable-next-line @eslint-react/purity -- "today" semantics; owned by Child Plan B
                openToDate={selectedDate || new Date()}
                placeholderText={placeholder ?? ''}
                popperModifiers={[offSetModifier as never]}
                preventOpenOnFocus
                readOnly={readOnly}
                ref={datePickerRef as any}
                selected={selectedDate}
                startDate={startDate}
                strictParsing
                showPopperArrow={false}
            >
                <div className='custom-calendary-container'>
                    <SecondaryButton
                        aria-label='Close calendar'
                        onClick={handleCloseCalendar}
                        onKeyDown={handleCalendarButtonKeyDown}
                        title='Close calendar'
                        type='button'
                    >
                        Close
                    </SecondaryButton>
                    <SecondaryButton
                        aria-label={'Select today\'s date'}
                        onClick={handleSelectToday}
                        onKeyDown={handleCalendarButtonKeyDown}
                        title={'Select today\'s date'}
                        type='button'
                    >
                        Today
                    </SecondaryButton>
                </div>
            </ReactDatePicker>
        </div>
    );
};

export default CustomDatePicker;
