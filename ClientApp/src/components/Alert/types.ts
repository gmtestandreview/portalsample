import type { ReactNode } from 'react';
import type { NotificationSeverity } from '../../storage/types';

/**
 * types.ts
 *
 * Type definitions for the Alert component and its variants.
 * Includes props for base alert functionality, as well as specific props for notification messages with severity levels.
 * 
 * @module AlertTypes
 * @author Greg M
 * @version 1.0.0
 * @since 2024-06-15
 * 
 */


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
