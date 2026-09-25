import type { ReactNode } from 'react';

export interface RouteLeavingGuardProps {
    when?: boolean;
    title?: ReactNode;
    body?: ReactNode;
    cancelBtn?: ReactNode;
    confirmBtn?: ReactNode;
}
