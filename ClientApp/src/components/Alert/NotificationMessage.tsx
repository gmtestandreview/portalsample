import { NotificationSeverity } from '../../storage/types';
import {
    AlertSuccess,
    AlertInfo,
    AlertWarning,
    AlertError,
} from '.';
import type { NotificationMessageProps } from './types';

/**
 * NotificationMessage Component
 *
 * A reusable notification message component that displays messages with different severity levels (success, information, warning, error).
 * This component handles the rendering of appropriate alert variants based on the severity prop and manages ARIA live announcements for accessibility. 
 * 
 * @param props 
 * @returns {JSX.Element} Rendered notification message element
 * 
 */

const NotificationMessage = (props: NotificationMessageProps) => {
    const {
        id,
        message,
        severity,
        canClose,
        onClose,
        role = severity === NotificationSeverity.Information ? 'status' : 'alert',
        ariaLive = severity === NotificationSeverity.Information
            || severity === NotificationSeverity.Success
            || severity === NotificationSeverity.Warning
            ? 'polite'
            : 'assertive',
    } = props;

    switch (severity) {
        case NotificationSeverity.Success:
            return (
                <AlertSuccess
                    id={id || 'notif-success-message'}
                    role={role}
                    ariaLive={ariaLive}
                    canClose={canClose}
                    onClose={onClose}
                >
                    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                        <div className='bgCircle mb-3 mb-sm-0 me-3'>
                            <i className='icon-tick' aria-hidden='true' />
                        </div>
                    </div>
                    <div>
                        {message}
                    </div>
                </AlertSuccess>
            );
        case NotificationSeverity.Information:
            return (
                <AlertInfo
                    id={id || 'notif-info-message'}
                    role={role}
                    ariaLive={ariaLive}
                    canClose={canClose}
                    onClose={onClose}
                >
                    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                        <div className='bgCircle mb-3 mb-sm-0 me-3'>
                            <i className='icon-info' aria-hidden='true' />
                        </div>
                    </div>
                    <div>
                        {message}
                    </div>
                </AlertInfo>
            );
        case NotificationSeverity.Warning:
            return (
                <AlertWarning
                    id={id || 'notif-warning-message'}
                    role={role}
                    ariaLive={ariaLive}
                    canClose={canClose}
                    onClose={onClose}
                >
                    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                        <div className='bgCircle mb-3 mb-sm-0 me-3'>
                            <i className='icon-warning' aria-hidden='true' />
                        </div>
                    </div>
                    <div>
                        {message}
                    </div>
                </AlertWarning>
            );
        case NotificationSeverity.Error:
        default:
            return (
                <AlertError
                    id={id || 'notif-error-message'}
                    role={role}
                    ariaLive={ariaLive}
                    canClose={canClose}
                    onClose={onClose}
                >
                    <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
                        <div className='bgCircle mb-3 mb-sm-0 me-3'>
                            <i className='icon-warning' aria-hidden='true' />
                        </div>
                    </div>
                    <div>
                        {message}
                    </div>
                </AlertError>
            );
    }
};

export default NotificationMessage;
