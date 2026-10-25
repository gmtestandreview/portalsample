import { act, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceType } from '../../../ClientApp/src/api/web-api-client';

import type {
  ServiceDto,
  ServicesOffered,
} from '../../../ClientApp/src/api/web-api-client';

import type * as WebApiClient from '../../../ClientApp/src/api/web-api-client';

import {
  DEFAULT_ACCESS_TOKEN,
  msalMocks,
  pendingToken,
  rejectToken,
  resetMsalMock,
  signOut,
  testAccount,
} from '../helpers/mockMsal';

import type { ClientMockOf } from '../helpers/mockApiClient';

import { renderWithRouter } from '../helpers/renderWithRouter';

import { defined } from '../helpers/defined';

const mocks = vi.hoisted(() => ({
  accountContext: vi.fn(),
  setUserProfile: vi.fn(),
  appLoggerError: vi.fn(),
  appLoggerInfo: vi.fn(),
}));

/** Filled in by the module-mock factory below, so the test can drive the same client instance. */
const clients = vi.hoisted(() => ({
  lookup: undefined as unknown as ClientMockOf<'getServices'>,
}));

vi.mock(import('@azure/msal-react'), async () => {
  const { msalReactModuleMock } = await import('../helpers/mockMsal');

  return msalReactModuleMock() satisfies __ExactMockModule<__TestMockModule2>;
});

vi.mock(
  import('../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const { createClientMockFor, webApiClientModuleMock } =
      await import('../helpers/mockApiClient');
    const original = await importOriginal<typeof WebApiClient>();

    clients.lookup = createClientMockFor('getServices');

    // Spreading the original keeps ServiceType a real enum. The component compares
    // `originalDefaultService === ServiceType.TestingCalibration`, so an undefined enum would send
    // every branch down the default arm and the redirect tests would pass for the wrong reason.
    return webApiClientModuleMock(original, {
      LookupClient: clients.lookup,
    }) satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['api://services/.default'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../ClientApp/src/authentication/hooks'),
  () =>
    ({
      default: () => mocks.accountContext(),
      useAccountDispatch: () => ({ setUserProfile: mocks.setUserProfile }),
    }) satisfies __ExactMockModule<__TestMockModule26>,
);

vi.mock(
  import('../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: { error: mocks.appLoggerError, info: mocks.appLoggerInfo },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const serviceDtos: ServiceDto[] = [
  {
    serviceType: ServiceType.TestingCalibration,
    title: 'Testing and calibration',
    description: 'Calibration of measuring instruments',
    icon: 'icon-calibration',
    meta: 'Most common',
  },
  {
    serviceType: ServiceType.PatternApproval,
    title: 'Pattern approval',
    description: 'Type approval of instrument patterns',
    icon: 'icon-approval',
    meta: 'Regulated',
  },
];

const accountWith = (services?: ServicesOffered[]) => ({
  details: { userProfile: { email: 'tester@example.gov.au', services } },
});

const renderRoute = async (path = '/services-we-offer') => {
  const ServicesWeOffer = (
    await import('../../../ClientApp/src/routes/services-we-offer')
  ).default;

  const result = renderWithRouter(<ServicesWeOffer />, {
    path: '/services-we-offer',
    initialPath: path,
    extraRoutes: [
      { path: '/dashboard', element: <div data-testid='dashboard' /> },
      { path: '/dashboard-ta', element: <div data-testid='dashboard-ta' /> },
    ],
  });

  // The load effect writes state in three waves - two flags before the request, one per matched
  // service after it, then two more in `finally`. A `waitFor` on rendered text resolves during the
  // middle wave, so the `finally` writes land after the assertion and outside any act scope, which
  // is what the act(...) warning reports. Flushing here lets the whole chain settle inside act.
  // This is owning the updates rather than silencing the warning: nothing is suppressed, and a
  // test still fails if the state it asserts never arrives.
  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

/** Both services present and active, neither default - the state that renders the selector. */
const noDefaultYet: ServicesOffered[] = [
  { service: ServiceType.TestingCalibration, isActive: true, isDefault: false },
  { service: ServiceType.PatternApproval, isActive: false, isDefault: false },
];

describe('services we offer', () => {
  beforeEach(() => {
    resetMsalMock();
    mocks.accountContext.mockReset();
    mocks.setUserProfile.mockReset().mockResolvedValue(true);
    mocks.appLoggerError.mockReset();
    mocks.appLoggerInfo.mockReset();
    clients.lookup.setAuthToken.mockReset();
    clients.lookup.methods.getServices
      .mockReset()
      .mockResolvedValue(serviceDtos);
    mocks.accountContext.mockReturnValue(accountWith(noDefaultYet));
  });
  describe('loading services', () => {
    it('acquires a token and renders every service returned', async () => {
      expect.assertions(4);
      await renderRoute();

      await waitFor(() =>
        expect(screen.getByText('Testing and calibration')).toBeInTheDocument(),
      );

      expect(msalMocks.acquireTokenSilent).toHaveBeenCalledWith({
        scopes: ['api://services/.default'],
        account: testAccount,
      });
      expect(clients.lookup.setAuthToken).toHaveBeenCalledWith(
        DEFAULT_ACCESS_TOKEN,
      );
      expect(screen.getByText('Pattern approval')).toBeInTheDocument();
    });
  });
});
