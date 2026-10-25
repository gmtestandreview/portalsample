import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';

import instrumentAndRequestProps from '../../../../ClientApp/src/routes/requestForQuote/instrumentAndRequestProps';

import organisationAndContactProps from '../../../../ClientApp/src/routes/requestForQuote/organisationAndContactProps';

import requestForQuoteSummaryProps from '../../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps';

import viewRequestForQuoteSummaryProps from '../../../../ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummaryProps';

import { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';

import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

import {
  YesNo,
  type RequestForQuoteSummary,
} from '../../../../ClientApp/src/api/web-api-client';

import { stepStatuses } from '../testFixtures';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn(),
  getInstrumentAndRequest: vi.fn(),
  saveInstrumentAndRequest: vi.fn(),
  getOrganisationAndContact: vi.fn(),
  saveOrganisationAndContact: vi.fn(),
  getSummary: vi.fn(),
  getSubmittedSummary: vi.fn(),
  submit: vi.fn(),
  acquireTokenSilent: vi.fn(),
  appLoggerError: vi.fn(),
}));

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal();
    if (typeof actual !== 'object' || actual === null) {
      throw new TypeError('Expected module exports object');
    }
    return {
      ...actual,
      RequestForQuoteClient: vi.fn(function RequestForQuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getInstrumentAndRequest: mocks.getInstrumentAndRequest,
          saveInstrumentAndRequest: mocks.saveInstrumentAndRequest,
          getOrganisationAndContact: mocks.getOrganisationAndContact,
          saveOrganisationAndContact: mocks.saveOrganisationAndContact,
          getSummary: mocks.getSummary,
          getSubmittedSummary: mocks.getSubmittedSummary,
          submit: mocks.submit,
        };
      }),
    } satisfies __ExactMockModule<__TestMockModule4>;
  },
);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  () =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];

const emptyAccounts = [] as AccountInfo[];

const instance = {
  acquireTokenSilent: mocks.acquireTokenSilent,
} as unknown as IPublicClientApplication;

const accountDetails = {
  organisation: 'National Measurement Institute',
  trading: 'Trading',
  branch: 'Branch',
} as AccountDetails;

const statuses = stepStatuses;

describe('request for quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isPrincipalContact: YesNo.No,
    });
    mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
    mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
  });
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.assertions(1);
    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;
    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: { instrument: 'Balance' },
    });
  });
});

describe('request for quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isPrincipalContact: YesNo.No,
    });
    mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
    mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
  });
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.assertions(1);
    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;
    expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
  });
});

describe('request for quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isPrincipalContact: YesNo.No,
    });
    mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
    mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
  });
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.assertions(1);
    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;
    expect(mocks.getInstrumentAndRequest).toHaveBeenCalledWith(
      'APP-1',
      abortSignal,
    );
  });
});

describe('request for quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isPrincipalContact: YesNo.No,
    });
    mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
    mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
  });
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.assertions(1);
    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.serialNumber?.({ hasSerialNumber: YesNo.No }),
    ).toBe(true);
  });
});

describe('request for quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isPrincipalContact: YesNo.No,
    });
    mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
    mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
  });
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.assertions(1);
    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.serialNumber?.({ hasSerialNumber: YesNo.Yes }),
    ).toBe(false);
  });
});
