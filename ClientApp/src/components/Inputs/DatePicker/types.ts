import type { FocusEventHandler, KeyboardEventHandler, ReactNode, RefObject } from 'react';

export interface DatePickerProps {
    calendarButtonTitle?: string;
    containerClassName?: string;
    currentDate?: Date | null;
    disabled?: boolean;
    errorMessage?: string;
    hasError?: boolean;
    id?: string;
    inlineHelp?: ReactNode;
    isSummary?: boolean;
    label?: string;
    maxDate?: Date;
    minDate?: Date;
    name: string;
    placeholder?: string;
    readOnly?: boolean;
    startDate?: Date | null;
}

export interface CustomDatePickerProps extends DatePickerProps {
    dateOnBlur: FocusEventHandler;
    dateOnChange: (date: Date | string | null) => void | Promise<void>;
}

export type CustomInputControlRef = HTMLInputElement;

export interface CustomInputForwardRefProps {
    /** Accessible name used by the calendar trigger button. */
    calendarButtonTitle: string;
    /** Keyboard handler supplied by the date-picker calendar integration. */
    calendarOnKeyDown?: KeyboardEventHandler;
    /** Additional CSS classes applied to the text input. */
    className?: string;
    /** Additional CSS classes applied to the form-field container. */
    containerClassName?: string;
    /** Prevents editing and calendar interaction when true. */
    disabled?: boolean;
    /** Validation message displayed when `hasError` is true. */
    errorMessage?: string;
    /** Ref used by the parent picker to access the validation message. */
    forwardedFeedbackRef?: RefObject<HTMLDivElement>;
    /** Ref used by the parent picker to access the contextual help text. */
    forwardedInlineHelpRef?: RefObject<HTMLDivElement>;
    /** Ref used by the parent picker to focus or inspect the text input. */
    forwardedControlRef?: RefObject<HTMLInputElement>;
    /** Controls whether the validation message is displayed. */
    hasError?: boolean;
    /** Contextual guidance associated with both the text input and calendar button. */
    inlineHelp?: ReactNode;
    /** Visible label for the date field. */
    label?: string;
    /** Formik field name and base for generated accessibility identifiers. */
    name: string;
    /** Called when focus leaves the complete input-and-button control. */
    onBlur?: FocusEventHandler;
    /** Called when the text value changes. */
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    /** Keyboard handler for the text input. */
    onKeyDown?: KeyboardEventHandler;
    /** Closes the calendar without changing the current value. */
    handleCloseCalendar: () => void;
    /** Ensures focus leaving the composite control also closes the calendar. */
    handleEnsureCalendarClosed: () => void;
    /** Opens the calendar when the trigger button is activated. */
    handleOpenCalendar: () => void;
    /** Example date format displayed while the field is empty. */
    placeholder?: string;
    /** Prevents editing while keeping the current value available for submission. */
    readOnly?: boolean;
    /** Unique DOM id used to track focus across the input and calendar button. */
    wrapperUUID: string;
}
