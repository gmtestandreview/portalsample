import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';

import deliveryAndReturnProps from '../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturnProps';

import paymentDetailsProps from '../../../../ClientApp/src/routes/acceptQuote/paymentDetailsProps';

import reportRecipientProps from '../../../../ClientApp/src/routes/acceptQuote/reportRecipientProps';

import summaryAndAcceptProps from '../../../../ClientApp/src/routes/acceptQuote/summaryAndAcceptProps';

import { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';

import { HttpStatusCode } from '../../../../ClientApp/src/types';

import { setDashboardNotification } from '../../../../ClientApp/src/storage/notification';

import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';

import {
  InvoiceSentToValues,
  ReportAddressTypeValues,
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  Title,
  YesNo,
  type PaymentDetailsStep,
  type ReportRecipientStep,
  type SummaryAndAcceptStep,
} from '../../../../ClientApp/src/api/web-api-client';

import { stepStatuses } from '../testFixtures';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn(),
  getDeliveryAndReturn: vi.fn(),
  saveDeliveryAndReturn: vi.fn(),
  getPaymentDetails: vi.fn(),
  savePaymentDetails: vi.fn(),
  getReportRecipient: vi.fn(),
  saveReportRecipient: vi.fn(),
  getSummaryAndAccept: vi.fn(),
  saveSummaryAndAccept: vi.fn(),
  acquireTokenSilent: vi.fn(),
  setDashboardNotification: vi.fn(),
  appLoggerError: vi.fn(),
  sessionSetItem: vi.fn(),
}));

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getDeliveryAndReturn: mocks.getDeliveryAndReturn,
          saveDeliveryAndReturn: mocks.saveDeliveryAndReturn,
          getPaymentDetails: mocks.getPaymentDetails,
          savePaymentDetails: mocks.savePaymentDetails,
          getReportRecipient: mocks.getReportRecipient,
          saveReportRecipient: mocks.saveReportRecipient,
          getSummaryAndAccept: mocks.getSummaryAndAccept,
          saveSummaryAndAccept: mocks.saveSummaryAndAccept,
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
  import('../../../../ClientApp/src/storage/notification'),
  () =>
    ({
      setDashboardNotification: mocks.setDashboardNotification,
    }) satisfies __ExactMockModule<__TestMockModule46>,
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

vi.mock(
  import('../../../../ClientApp/src/storage/sessionStorageCache'),
  () =>
    ({
      default: () => ({
        setItem: mocks.sessionSetItem,
      }),
    }) satisfies __ExactMockModule<__TestMockModule72>,
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

describe('accept quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      returnContactType: 'SamePerson',
    });
    mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
    mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
    mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
  });
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.assertions(1);
    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: { returnContactType: 'SamePerson' },
    });
  });
});

describe('accept quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      returnContactType: 'SamePerson',
    });
    mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
    mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
    mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
  });
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.assertions(1);
    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    expect(mocks.getDeliveryAndReturn).toHaveBeenCalledWith('Q-1', abortSignal);
  });
});

describe('accept quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      returnContactType: 'SamePerson',
    });
    mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
    mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
    mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
  });
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.assertions(1);
    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.contactHide?.({
        returnContactType: ReturnContactTypeValues.SamePerson,
      }),
    ).toBe(true);
  });
});

describe('accept quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      returnContactType: 'SamePerson',
    });
    mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
    mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
    mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
  });
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.assertions(1);
    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.contactHide?.({
        returnContactType: ReturnContactTypeValues.DifferentPerson,
      }),
    ).toBe(false);
  });
});

describe('accept quote wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getDeliveryAndReturn.mockResolvedValue({
      returnContactType: 'SamePerson',
    });
    mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
    mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
    mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
  });
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.assertions(1);
    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.contact?.titleOther?.({
        contact: { title: Title.Other },
      }),
    ).toBe(false);
  });
});
