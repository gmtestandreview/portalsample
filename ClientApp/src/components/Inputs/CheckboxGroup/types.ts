import type { ChangeEvent } from 'react';

export interface CheckboxOption<T> {
    value: T;
    label: string;
    id?: string;
    disabled?: boolean;
}

export interface CheckboxGroupProps<T> {
    name: string;
    legend: string;
    id?: string;
    options: CheckboxOption<T>[];
    isSummary?: boolean;
    displayHorizontally?: boolean;
    inlineHelp?: string;
    inlineHelpTitle?: string;
    containerClassName?: string;
    legendClassName?: string;
    className?: string;
    subFormField?: boolean;
    supressFieldLevelMessages?: boolean;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}
