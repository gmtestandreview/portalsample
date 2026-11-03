import { NotificationSeverity } from '../../storage/types';
import type { Notification } from '../../storage/types';
import { HttpStatusCode } from '../../types';

export const DashBoardNotifications = {
  getForbiddenNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getConflictNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getNotFoundNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getPreconditionFailedNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getServiceUnavailableNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getUnprocessableNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getServerErrorNotification: (): Notification => {
    const message = {
      message:
        'We are unable to process your request. Your changes have not been saved. Please contact support.',
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getThirdPartyAccessNotification: (orgName: string): Notification => {
    const message = {
      message: `You no longer have access to the records for ${orgName}.  Your changes have not been saved.`,
      severity: NotificationSeverity.Error,
    };
    return message;
  },

  getReportFormsGeneratedNotification: (): Notification => {
    const message = {
      message:
        'New initial reporting and/or ongoing reporting forms have been generated',
      severity: NotificationSeverity.Information,
    };
    return message;
  },

  getDashboardErrorNotification: (
    statusCode: HttpStatusCode,
    _orgName?: string,
  ): Notification => {
    switch (statusCode) {
      case HttpStatusCode.Conflict:
        return DashBoardNotifications.getConflictNotification();
      case HttpStatusCode.Gone:
        return DashBoardNotifications.getNotFoundNotification();
      case HttpStatusCode.PreconditionFailed:
        return DashBoardNotifications.getPreconditionFailedNotification();
      case HttpStatusCode.ServiceUnavailable:
        return DashBoardNotifications.getServiceUnavailableNotification();
      case HttpStatusCode.UnprocessableEntity:
        return DashBoardNotifications.getUnprocessableNotification();
      case HttpStatusCode.Forbidden:
        return DashBoardNotifications.getForbiddenNotification();
      case HttpStatusCode.InternalServerError:
        return DashBoardNotifications.getServerErrorNotification();
      default:
        return DashBoardNotifications.getServerErrorNotification();
    }
  },
};
