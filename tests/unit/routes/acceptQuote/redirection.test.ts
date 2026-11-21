import { describe, expect, it, vi } from 'vitest';
import { acceptQuoteRedirectionOnError } from '../../../../ClientApp/src/routes/acceptQuote/redirection';
import { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';
import { HttpStatusCode } from '../../../../ClientApp/src/types';
import { NotificationSeverity } from '../../../../ClientApp/src/storage/types';

const mocks = vi.hoisted(() => ({
  setDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: mocks.setDashboardNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
);

describe(acceptQuoteRedirectionOnError, () => {
  it('sends a failed load back to the quote summary without notifying', () => {
    expect.assertions(2);

    mocks.setDashboardNotification.mockClear();
    const handler = acceptQuoteRedirectionOnError('Q-1');

    expect(handler(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe(
      '/accept-quote/Q-1/view-summary',
    );
    expect(mocks.setDashboardNotification).not.toHaveBeenCalled();
  });

  it('notifies and returns to the dashboard when the request was deleted', () => {
    expect.assertions(2);

    mocks.setDashboardNotification.mockClear();
    const handler = acceptQuoteRedirectionOnError('Q-1');

    expect(handler(HttpStatusCode.NotFound, ErrorType.Update)).toBe('/');
    expect(mocks.setDashboardNotification).toHaveBeenCalledExactlyOnceWith({
      message:
        'Another person has deleted this request. Your changes have not been saved.',
      severity: NotificationSeverity.Error,
    });
  });

  it.each([
    [HttpStatusCode.InternalServerError, ErrorType.Load],
    [HttpStatusCode.PreconditionFailed, ErrorType.Update],
  ])('returns undefined for status %s with error type %s', (code, type) => {
    expect.assertions(2);

    mocks.setDashboardNotification.mockClear();
    const handler = acceptQuoteRedirectionOnError('Q-1');

    expect(handler(code, type)).toBeUndefined();
    expect(mocks.setDashboardNotification).not.toHaveBeenCalled();
  });
});
