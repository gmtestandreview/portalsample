import type { ReactNode } from 'react';

export interface DetailsProps {
    id?: string;
    title: ReactNode;
    inlineHelp?: ReactNode;
}
