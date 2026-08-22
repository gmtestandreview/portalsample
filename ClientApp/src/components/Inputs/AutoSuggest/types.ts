import type { ReactNode } from 'react';

export interface AutoSuggestOption<T = unknown> {
    id: string;
    displayText: string;
    value: T;
}

export interface AutoSuggestProps<T = unknown> {
    id?: string;
    name: string;
    label: ReactNode;
    getOptions: (term: string) => Promise<AutoSuggestOption<T>[]>;
    onSelectedOption: (option?: AutoSuggestOption<T>) => void | Promise<void>;
    selectedOption?: string | null;
    inlineHelp?: ReactNode;
    placeholder?: string;
    [key: string]: unknown;
}

export interface AutoSuggestContainerProps<T = unknown> {
    id?: string;
    name: string;
    label: ReactNode;
    options: AutoSuggestOption<T>[];
    noResult?: boolean;
    noResultMessage?: ReactNode;
    error?: boolean;
    errorMessage?: ReactNode;
    loading?: boolean;
    loadingMessage?: ReactNode;
    searchTerm?: string | null;
    onSearchTermChange: (term: string) => void | Promise<void>;
    onCancel: () => void;
    onSelectedOption: (option: AutoSuggestOption<T>) => void | Promise<void>;
    inlineHelp?: ReactNode;
    placeholder?: string;
}

export interface AutoSuggestOptionProps<T = unknown> extends AutoSuggestOption<T> {
    selected?: string;
    ariaLabel?: string;
}

export interface AutoSuggestOptionsProps<T = unknown> {
    id?: string;
    name: string;
    options: AutoSuggestOption<T>[];
    selectedOptionId?: string;
}
