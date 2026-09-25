import type { ChangeEventHandler, ReactNode } from 'react';

export interface SelectInputOption<T = string | number> {
    value: T;
    displayText: string;
    className?: string;
    disabled?: boolean;
    hidden?: boolean;
}

export interface SelectInputProps<T = string | number> {
    displayHorizontally?: boolean;
    label: string;
    inlineHelp?: ReactNode;
    inlineHelpTitle?: string;
    options?: SelectInputOption<T>[];
    defaultValue?: T | '';
    defaultDisplayText?: string;
    className?: string;
    containerClassName?: string;
    name: string;
    id?: string;
    disabled?: boolean;
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    isSummary?: boolean;
    readOnly?: boolean;
    addBlank?: boolean;
    [key: string]: unknown;
}
