/* eslint-disable class-methods-use-this */

import { NotificationSeverity } from '../../storage/types';
import type { Notification } from '../../storage/types';
import { HttpStatusCode } from '../../types';

export class DashBoardNotifications {
    static readonly getForbiddenNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getConflictNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getNotFoundNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getPreconditionFailedNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getServiceUnavailableNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getUnprocessableNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getServerErrorNotification = (): Notification => {
        const message = {
            message: 'We are unable to process your request. Your changes have not been saved. Please contact support.',
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getThirdPartyAccessNotification = (orgName: string): Notification => {
        const message = {
            message: `You no longer have access to the records for ${orgName}.  Your changes have not been saved.`,
            severity: NotificationSeverity.Error,
        };
        return message;
    };

    static readonly getReportFormsGeneratedNotification = (): Notification => {
        const message = {
            message: 'New initial reporting and/or ongoing reporting forms have been generated',
            severity: NotificationSeverity.Information,
        };
        return message;
    };

    static readonly getDashboardErrorNotification = (statusCode: HttpStatusCode, _orgName?: string): Notification => {
        switch (statusCode) {
            case HttpStatusCode.Conflict:
                return this.getConflictNotification();
            case HttpStatusCode.Gone:
                return this.getNotFoundNotification();
            case HttpStatusCode.PreconditionFailed:
                return this.getPreconditionFailedNotification();
            case HttpStatusCode.ServiceUnavailable:
                return this.getServiceUnavailableNotification();
            case HttpStatusCode.UnprocessableEntity:
                return this.getUnprocessableNotification();
            case HttpStatusCode.Forbidden:
                return this.getForbiddenNotification();
            case HttpStatusCode.InternalServerError:
                return this.getServerErrorNotification();
            default:
                return this.getServerErrorNotification();
        }
    };
}
