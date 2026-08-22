/* eslint-disable max-len */
import { Alert } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import type { AlertProps, BaseAlertProps } from './types';

/**
 * Internal Alert component with customizable styling and behavior.
 * Handles state management for dismissible alerts and ARIA announcements.
 *
 * @internal Use the exported Alert variant components (AlertSuccess, AlertInfo, etc.) instead.
 * @param {BaseAlertProps} props - Component props
 * @returns {JSX.Element} Rendered alert element
 */
const AlertMessage = (props: BaseAlertProps) => {
    const {
        id,
        testId,
        children,
        canClose,
        onClose,
        className = '', // default props
        variant,
        role,
        ariaLive,
    } = props;

    const [show, setShow] = useState<boolean>(true);

    const closeAlert = () => {
        if (onClose) {
            onClose();
        }

        setShow(false);
    };

    useEffect(() => {
        setShow(true);
    }, [children]);

    return (
        <Alert
            id={id}
            data-testid={testId}
            role={role}
            className={`d-flex ${className}`}
            dismissible={canClose}
            onClose={closeAlert}
            show={show}
            variant={variant}
            aria-live={ariaLive || 'polite'}
            tabIndex={-1}
        >
            {children}
        </Alert>
    );
};

/**
 * AlertSuccess Component
 *
 * Displays a success message with green styling and polite ARIA live announcement.
 * Use for confirming successful operations (form submission, save completed, etc.).
 *
 * @param {AlertProps} props - Component props
 * @param {React.ReactNode} props.children - Alert message content
 * @param {string} [props.id] - Unique identifier for the alert
 * @param {string} [props.testId] - Data-testid for testing
 * @param {boolean} [props.canClose] - Show close button (default: false)
 * @param {Function} [props.onClose] - Callback when alert is dismissed
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <AlertSuccess>
 *   Form submitted successfully!
 * </AlertSuccess>
 *
 * @returns {JSX.Element} Green success alert
 */
export const AlertSuccess = (props: AlertProps) => <AlertMessage variant='success' role='alert' ariaLive='polite' {...props} />;

/**
 * AlertInfo Component
 *
 * Displays informational messages with blue styling and polite ARIA live announcement.
 * Use for general information that doesn't require immediate action.
 *
 * @param {AlertProps} props - Component props
 * @param {React.ReactNode} props.children - Alert message content
 * @param {string} [props.id] - Unique identifier for the alert
 * @param {string} [props.testId] - Data-testid for testing
 * @param {boolean} [props.canClose] - Show close button (default: false)
 * @param {Function} [props.onClose] - Callback when alert is dismissed
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <AlertInfo>
 *   Your profile will be updated within 24 hours.
 * </AlertInfo>
 *
 * @returns {JSX.Element} Blue information alert
 */
export const AlertInfo = (props: AlertProps) => <AlertMessage variant='info' role='status' ariaLive='polite' {...props} />;

/**
 * AlertWarning Component
 *
 * Displays warning messages with yellow styling and polite ARIA live announcement.
 * Use for cautionary information that requires user attention (unsaved changes, deprecated features, etc.).
 *
 * @param {AlertProps} props - Component props
 * @param {React.ReactNode} props.children - Alert message content
 * @param {string} [props.id] - Unique identifier for the alert
 * @param {string} [props.testId] - Data-testid for testing
 * @param {boolean} [props.canClose] - Show close button (default: false)
 * @param {Function} [props.onClose] - Callback when alert is dismissed
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <AlertWarning canClose onClose={handleDismiss}>
 *   You have unsaved changes. Please save before leaving.
 * </AlertWarning>
 *
 * @returns {JSX.Element} Yellow warning alert
 */
export const AlertWarning = (props: AlertProps) => <AlertMessage variant='warning' role='alert' ariaLive='polite' {...props} />;

/**
 * AlertError Component
 *
 * Displays error messages with red styling and assertive ARIA live announcement.
 * Use for critical errors that require immediate user action (validation failures, failed operations, etc.).
 * Assertive announcement ensures screen readers interrupt current speech.
 *
 * @param {AlertProps} props - Component props
 * @param {React.ReactNode} props.children - Alert message content
 * @param {string} [props.id] - Unique identifier for the alert
 * @param {string} [props.testId] - Data-testid for testing
 * @param {boolean} [props.canClose] - Show close button (default: false)
 * @param {Function} [props.onClose] - Callback when alert is dismissed
 * @param {string} [props.className] - Additional CSS classes
 *
 * @example
 * <AlertError role="alert">
 *   Failed to save form. Please check your connection and try again.
 * </AlertError>
 *
 * @returns {JSX.Element} Red error alert with assertive announcement
 */
export const AlertError = (props: AlertProps) => <AlertMessage variant='danger' role='alert' ariaLive='assertive' {...props} />;
