import { ErrorType } from '../../components/forms/WizardForm/types';
import { setDashboardNotification } from '../../storage/notification';
import { NotificationSeverity } from '../../storage/types';
import { HttpStatusCode } from '../../types';

export const acceptQuoteRedirectionOnError =
  (id: string) => (errorCode: HttpStatusCode, errorType: ErrorType) => {
    if (
      errorCode === HttpStatusCode.PreconditionFailed &&
      errorType === ErrorType.Load
    ) {
      return `/accept-quote/${id}/view-summary`;
    }

    if (
      errorCode === HttpStatusCode.NotFound &&
      errorType === ErrorType.Update
    ) {
      setDashboardNotification({
        message:
          'Another person has deleted this request. Your changes have not been saved.',
        severity: NotificationSeverity.Error,
      });
      return '/';
    }

    return undefined;
  };
