import { describe, expect, it } from 'vitest';
import { DashBoardNotifications } from '../../../../ClientApp/src/routes/common/dashboardNotifications';
import { NotificationSeverity } from '../../../../ClientApp/src/storage/types';
import { HttpStatusCode } from '../../../../ClientApp/src/types';

const defaultError = {
  message:
    'We are unable to process your request. Your changes have not been saved. Please contact support.',
  severity: NotificationSeverity.Error,
};

// DashBoardNotifications is an object namespace, not a function, so a string
// suite title is used here (vitest/prefer-describe-function-title applies only
// to function/class references).
describe('dashboard notifications', () => {
  it.each([
    ['forbidden', DashBoardNotifications.getForbiddenNotification],
    ['conflict', DashBoardNotifications.getConflictNotification],
    ['not found', DashBoardNotifications.getNotFoundNotification],
    [
      'precondition failed',
      DashBoardNotifications.getPreconditionFailedNotification,
    ],
    [
      'service unavailable',
      DashBoardNotifications.getServiceUnavailableNotification,
    ],
    ['unprocessable', DashBoardNotifications.getUnprocessableNotification],
    ['server error', DashBoardNotifications.getServerErrorNotification],
  ])(
    'returns the default dashboard error notification for %s',
    (_name, factory) => {
      expect.hasAssertions();
      expect(factory()).toStrictEqual(defaultError);
    },
  );

  it('returns contextual third-party access and report generated notifications', () => {
    expect.hasAssertions();
    expect(
      DashBoardNotifications.getThirdPartyAccessNotification('NMI Branch'),
    ).toStrictEqual({
      message:
        'You no longer have access to the records for NMI Branch.  Your changes have not been saved.',
      severity: NotificationSeverity.Error,
    });

    expect(
      DashBoardNotifications.getReportFormsGeneratedNotification(),
    ).toStrictEqual({
      message:
        'New initial reporting and/or ongoing reporting forms have been generated',
      severity: NotificationSeverity.Information,
    });
  });

  it.each([
    [HttpStatusCode.Conflict],
    [HttpStatusCode.Gone],
    [HttpStatusCode.PreconditionFailed],
    [HttpStatusCode.ServiceUnavailable],
    [HttpStatusCode.UnprocessableEntity],
    [HttpStatusCode.Forbidden],
    [HttpStatusCode.InternalServerError],
    [HttpStatusCode.NotFound],
  ])('maps dashboard error status %s to an error notification', (status) => {
    expect.hasAssertions();
    expect(
      DashBoardNotifications.getDashboardErrorNotification(status),
    ).toStrictEqual(defaultError);
  });
});
