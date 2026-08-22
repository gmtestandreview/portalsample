import type { ReactNode } from 'react';

export interface AddressLookupProps {
    name: string;
    label?: string;
    maxResults?: number;
    placeholder?: string;
    isSummary?: boolean;
    disabled?: boolean;
    inlineHelp?: ReactNode;
}

export interface ManualAddressInputProps {
    name: string;
    disabled?: boolean;
    inlineHelp?: ReactNode;
}
