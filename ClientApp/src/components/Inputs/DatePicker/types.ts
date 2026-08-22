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
    calendarButtonTitle: string;
    calendarOnKeyDown?: KeyboardEventHandler;
    className?: string;
    containerClassName?: string;
    disabled?: boolean;
    errorMessage?: string;
    forwardedFeedbackRef?: RefObject<HTMLDivElement>;
    forwardedInlineHelpRef?: RefObject<HTMLDivElement>;
    forwardedControlRef?: RefObject<HTMLInputElement>;
    hasError?: boolean;
    inlineHelp?: ReactNode;
    label?: string;
    name: string;
    onBlur?: FocusEventHandler;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: KeyboardEventHandler;
    handleCloseCalendar: () => void;
    handleEnsureCalendarClosed: () => void;
    handleOpenCalendar: () => void;
    placeholder?: string;
    readOnly?: boolean;
    wrapperUUID: string;
}
