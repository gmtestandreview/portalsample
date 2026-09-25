import type { ChangeEventHandler, ReactNode } from 'react';

export interface CheckboxProps<T = unknown> {
    label: string;
    name: string;
    id?: string;
    value?: T;
    descriptor?: ReactNode;
    disabled?: boolean;
    inlineHelp?: ReactNode;
    supressFieldLevelMessages?: boolean;
    containerClassName?: string;
    className?: string;
    subFormField?: ReactNode;
    isSummary?: boolean;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    validationClassName?: string;
}
