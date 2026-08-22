import type { ChangeEventHandler, ReactNode } from 'react';

export interface RadioButtonProps<T = unknown> {
    label: string;
    value: T;
    descriptor?: ReactNode;
    disabled?: boolean;
    id: string;
    name?: string;
    subFormField?: ReactNode;
    onChange?: ChangeEventHandler<any>;
    [key: string]: unknown;
}
