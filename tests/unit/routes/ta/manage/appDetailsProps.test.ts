import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';

import appDetailsProps from '../../../../../ClientApp/src/routes/ta/manage/appDetailsProps';

import type * as WebApiClientModule from '../../../../../ClientApp/src/api/web-api-client';

import {
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
  type RequestForPatternApprovalAppDetails,
  YesNo,
} from '../../../../../ClientApp/src/api/web-api-client';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn(),
  getAppDetails: vi.fn(),
  acquireTokenSilent: vi.fn(),
  appLoggerError: vi.fn(),
  appLoggerVerbose: vi.fn(),
}));

vi.mock(
  import('../../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      RequestForPatternApprovalClient: vi.fn(
        function RequestForPatternApprovalClientMock() {
          return {
            setAuthToken: mocks.setAuthToken,
            getAppDetails: mocks.getAppDetails,
          };
        },
      ),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];

const emptyAccounts = [] as AccountInfo[];

const instance = {
  acquireTokenSilent: mocks.acquireTokenSilent,
} as unknown as IPublicClientApplication;

describe(appDetailsProps, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getAppDetails.mockResolvedValue({
      applicationDetails: { referenceId: 'PA-1' },
    });
  });
  it('loads app details and exposes summary hiding rules', async () => {
    expect.assertions(1);
    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;
    await expect(props.loadStepValues(abortSignal)).resolves.toEqual({
      formValues: { applicationDetails: { referenceId: 'PA-1' } },
    });
  });
});

describe(appDetailsProps, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getAppDetails.mockResolvedValue({
      applicationDetails: { referenceId: 'PA-1' },
    });
  });
  it('loads app details and exposes summary hiding rules', async () => {
    expect.assertions(1);
    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;
    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
  });
});

describe(appDetailsProps, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getAppDetails.mockResolvedValue({
      applicationDetails: { referenceId: 'PA-1' },
    });
  });
  it('loads app details and exposes summary hiding rules', async () => {
    expect.assertions(1);
    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;
    expect(mocks.getAppDetails).toHaveBeenCalledWith('PA-1', abortSignal);
  });
});

describe(appDetailsProps, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getAppDetails.mockResolvedValue({
      applicationDetails: { referenceId: 'PA-1' },
    });
  });
  it('loads app details and exposes summary hiding rules', async () => {
    expect.assertions(1);
    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;
    expect(props.location).toBe('/summary');
  });
});

describe(appDetailsProps, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getAppDetails.mockResolvedValue({
      applicationDetails: { referenceId: 'PA-1' },
    });
  });
  it('loads app details and exposes summary hiding rules', async () => {
    expect.assertions(1);
    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;
    expect(props.title).toBe('Summary and submit');
  });
});
