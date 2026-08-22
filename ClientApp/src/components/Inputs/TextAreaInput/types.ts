import type { ReactNode } from 'react';

export interface TextAreaInputProps {
    label: string;
    inlineHelp?: ReactNode;
    disabled?: boolean;
    name: string;
    id?: string;
    rows?: number;
    placeholder?: string;
    maxCharacters?: number;
    containerClassName?: string;
    className?: string;
    isSummary?: boolean;
}
