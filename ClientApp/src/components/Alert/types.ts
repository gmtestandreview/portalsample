import type { ReactNode } from 'react';
import type { NotificationSeverity } from '../../storage/types';

export interface BaseAlertProps {
    id?: string;
    testId?: string;
    children?: ReactNode;
    canClose?: boolean;
    onClose?: () => void;
    className?: string;
    variant?: string;
    role?: string;
    ariaLive?: 'off' | 'polite' | 'assertive';
}

export type AlertProps = Omit<BaseAlertProps, 'variant'>;

export interface NotificationMessageProps {
    id?: string;
    message?: ReactNode;
    severity?: NotificationSeverity;
    canClose?: boolean;
    onClose?: () => void;
    role?: string;
    ariaLive?: 'off' | 'polite' | 'assertive';
}
