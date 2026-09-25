import type { ChangeEventHandler, ReactNode } from 'react';
import type { RadioButtonProps } from '../RadioButton/types';

export interface RadioButtonGroupProps<T = unknown> {
    displayHorizontally?: boolean;
    inlineHelp?: ReactNode;
    inlineHelpTitle?: ReactNode;
    options: RadioButtonProps<T>[];
    name: string;
    legend: string;
    id?: string;
    onChange?: ChangeEventHandler<any>;
    isSummary?: boolean;
    containerClassName?: string;
    className?: string;
    subFormField?: ReactNode;
    [key: string]: unknown;
}
