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
  id?: string | undefined;
  testId?: string | undefined;
  children?: ReactNode | undefined;
  canClose?: boolean | undefined;
  onClose?: (() => void) | undefined;
  className?: string | undefined;
  variant?: string | undefined;
  role?: string | undefined;
  ariaLive?: 'off' | 'polite' | 'assertive' | undefined;
}

export type AlertProps = Omit<BaseAlertProps, 'variant'>;

export interface NotificationMessageProps {
  id?: string | undefined;
  message?: ReactNode | undefined;
  severity?: NotificationSeverity | undefined;
  canClose?: boolean | undefined;
  onClose?: (() => void) | undefined;
  role?: string | undefined;
  ariaLive?: 'off' | 'polite' | 'assertive' | undefined;
}
