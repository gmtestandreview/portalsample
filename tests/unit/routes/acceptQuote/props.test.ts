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
  setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getDeliveryAndReturn: vi.fn<(...args: unknown[]) => unknown>(),
  saveDeliveryAndReturn: vi.fn<(...args: unknown[]) => unknown>(),
  getPaymentDetails: vi.fn<(...args: unknown[]) => unknown>(),
  savePaymentDetails: vi.fn<(...args: unknown[]) => unknown>(),
  getReportRecipient: vi.fn<(...args: unknown[]) => unknown>(),
  saveReportRecipient: vi.fn<(...args: unknown[]) => unknown>(),
  getSummaryAndAccept: vi.fn<(...args: unknown[]) => unknown>(),
  saveSummaryAndAccept: vi.fn<(...args: unknown[]) => unknown>(),
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  setDashboardNotification: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
  sessionSetItem: vi.fn<(...args: unknown[]) => unknown>(),
}));

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      AcceptQuoteClient: vi.fn<(...args: unknown[]) => unknown>(
        function AcceptQuoteClientMock() {
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
        },
      ),
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

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/instrumentation/AppLogger',
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock(
  '../../../../ClientApp/src/storage/sessionStorageCache',
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
    expect.hasAssertions();

    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      loadCalls: mocks.getDeliveryAndReturn.mock.calls,
      hidden: [
        props.hidingFields?.contactHide?.({
          returnContactType: ReturnContactTypeValues.SamePerson,
        }),
        props.hidingFields?.contactHide?.({
          returnContactType: ReturnContactTypeValues.DifferentPerson,
        }),
        props.hidingFields?.contact?.titleOther?.({
          contact: { title: Title.Other },
        }),
        props.hidingFields?.returnAddress?.({
          returnAddressType: ReturnAddressTypeValues.Other,
        }),
        props.hidingFields?.carrierHide?.({
          returnMethod: ReturnMethodValues.ClientWillProvide,
        }),
      ],
      bannerRefTitle: props.bannerRefTitle,
    }).toStrictEqual({
      loaded: { stepValues: { returnContactType: 'SamePerson' } },
      loadCalls: [['Q-1', abortSignal]],
      hidden: [true, false, false, false, false],
      bannerRefTitle: 'Quotation ID: Q-1',
    });

    await props.onSaveAndNext?.(
      { returnContactType: ReturnContactTypeValues.SamePerson },
      true,
      abortSignal,
    );

    expect({
      saveCalls: mocks.saveDeliveryAndReturn.mock.calls,
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.NotFound,
          ErrorType.Update,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Update,
        ),
      ],
      notificationCalls: vi.mocked(setDashboardNotification).mock.calls,
    }).toMatchObject({
      saveCalls: [
        [
          'Q-1',
          {
            applicationId: 'Q-1',
            formStep: { returnContactType: 'SamePerson' },
            isCompletingStep: true,
          },
          abortSignal,
        ],
      ],
      redirects: ['/accept-quote/Q-1/view-summary', '/', undefined],
      notificationCalls: [
        [
          expect.objectContaining({
            message: expect.stringContaining(
              'Another person has deleted this request',
            ),
          }),
        ],
      ],
    });
  });

  it('loads and saves payment details while logging load and save failures', async () => {
    expect.hasAssertions();

    const props = paymentDetailsProps(
      'Q-2',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      hidden: [
        props.hidingFields?.contactHide?.({
          invoiceSentTo: InvoiceSentToValues.SamePerson,
        }),
        props.hidingFields?.contactHide?.({
          invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        }),
        props.hidingFields?.contact?.titleOther?.({
          contact: { title: Title.Dr },
        }),
      ],
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.NotFound,
          ErrorType.Update,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Update,
        ),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { invoiceSentTo: 'SamePerson' } },
      hidden: [true, false, true],
      redirects: ['/accept-quote/Q-2/view-summary', '/', undefined],
    });

    const paymentValues: PaymentDetailsStep = {
      invoiceSentTo: InvoiceSentToValues.DifferentPerson,
    };
    await props.onSaveAndExit?.(paymentValues, false, abortSignal);

    expect(mocks.savePaymentDetails.mock.calls).toStrictEqual([
      [
        'Q-2',
        {
          applicationId: 'Q-2',
          formStep: { invoiceSentTo: InvoiceSentToValues.DifferentPerson },
          isCompletingStep: false,
        },
        abortSignal,
      ],
    ]);

    mocks.savePaymentDetails.mockRejectedValueOnce(new Error('save failed'));

    const captureError = async (invoke: () => unknown) => {
      try {
        await invoke();
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const saveError = await captureError(() =>
      props.onSaveAndNext?.(paymentValues, true, abortSignal),
    );

    mocks.getPaymentDetails.mockRejectedValueOnce(new Error('load failed'));

    const loadError = await captureError(() =>
      props.loadStepValues?.(abortSignal),
    );

    expect({
      saveError,
      saveLog: mocks.appLoggerError.mock.calls[0],
      loadError,
      loadLog: mocks.appLoggerError.mock.calls[1],
    }).toMatchObject({
      saveError: 'save failed',
      saveLog: [
        'Failed to save payment details:',
        expect.any(Error),
        { ApplicationId: 'Q-2' },
      ],
      loadError: 'There was an error retrieving your details.',
      loadLog: [
        'Failed to load payment details',
        expect.any(Error),
        { Id: 'Q-2' },
      ],
    });
  });

  it('loads and saves report recipient details with custom discard and error logging', async () => {
    expect.hasAssertions();

    const props = reportRecipientProps(
      'Q-3',
      'RFQ-3',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      hidden: [
        props.hidingFields?.contact?.titleOther?.({
          contact: { title: Title.Other },
        }),
        props.hidingFields?.businessStreetAddress?.({
          reportAddressType: ReportAddressTypeValues.Other,
        }),
        props.hidingFields?.businessStreetAddress?.({
          reportAddressType: ReportAddressTypeValues.BusinessAddress,
        }),
      ],
      discard: props.discard?.locationOnCancel,
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.NotFound,
          ErrorType.Update,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Update,
        ),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { reportAddressType: 'Other' } },
      hidden: [false, false, true],
      discard: '/quotation/RFQ-3',
      redirects: ['/accept-quote/Q-3/view-summary', '/', undefined],
    });

    const recipientValues: ReportRecipientStep = {
      reportAddressType: ReportAddressTypeValues.Other,
    };
    await props.onSaveAndNext?.(recipientValues, true, abortSignal);

    expect(mocks.saveReportRecipient.mock.calls).toStrictEqual([
      [
        'Q-3',
        {
          applicationId: 'Q-3',
          formStep: { reportAddressType: 'Other' },
          isCompletingStep: true,
        },
        abortSignal,
      ],
    ]);

    mocks.saveReportRecipient.mockRejectedValueOnce(new Error('save failed'));

    const captureError = async (invoke: () => unknown) => {
      try {
        await invoke();
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const saveError = await captureError(() =>
      props.onSaveAndExit?.(recipientValues, false, abortSignal),
    );

    expect({
      saveError,
      loggerCall: mocks.appLoggerError.mock.calls.at(-1),
    }).toMatchObject({
      saveError: 'save failed',
      loggerCall: [
        'Failed to save payment report recipient',
        expect.any(Error),
        { Id: 'Q-3' },
      ],
    });
  });

  it('loads, saves, completes, and hides summary/accept sections', async () => {
    expect.hasAssertions();

    const props = summaryAndAcceptProps(
      'Q-4',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const abortSignal = new AbortController().signal;
    const summary = {
      associatedDisputes: YesNo.No,
      acceptQuotePreInfo: { quoteRequestIdNum: 'RFQ-NUM-4' },
      reportRecipient: {
        organisationDifferent: YesNo.No,
        isRecipientMailingAddressSame: true,
        contact: { title: Title.Other },
      },
      deliveryAndReturn: {
        returnContactType: ReturnContactTypeValues.SamePerson,
        contact: { title: Title.Dr },
      },
      paymentDetails: {
        invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        contact: { title: Title.Other },
      },
      requestForQuote: {
        contact: { title: Title.Dr },
      },
    } satisfies SummaryAndAcceptStep;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      hidden: [
        props.hidingFields?.associatedDispute?.(summary),
        props.hidingFields?.reportRecipient?.rfqHide?.(summary),
        props.hidingFields?.reportRecipient?.organisationNameHide?.(summary),
        props.hidingFields?.reportRecipient?.contact?.titleOther?.(summary),
        props.hidingFields?.reportRecipient?.recipientMailingAddress?.(summary),
        props.hidingFields?.deliveryAndReturn?.rfqHide?.(summary),
        props.hidingFields?.deliveryAndReturn?.contactHide?.(summary),
        props.hidingFields?.deliveryAndReturn?.contact?.titleOther?.(summary),
        props.hidingFields?.paymentDetails?.rfqHide?.(summary),
        props.hidingFields?.paymentDetails?.contactHide?.(summary),
        props.hidingFields?.paymentDetails?.contact?.titleOther?.(summary),
        props.hidingFields?.requestForQuote?.contact?.titleOther?.(summary),
      ],
    }).toStrictEqual({
      loaded: { stepValues: { associatedDisputes: 'No' } },
      hidden: [
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        true,
        true,
        false,
        false,
        true,
      ],
    });

    await props.onSaveAndExit?.(summary, false, abortSignal);

    expect(mocks.sessionSetItem.mock.calls).toStrictEqual([]);

    await props.onSaveAndNext?.(summary, true, abortSignal);

    expect({
      saveCall: mocks.saveSummaryAndAccept.mock.calls.at(-1),
      sessionCalls: mocks.sessionSetItem.mock.calls,
      redirects: [
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.PreconditionFailed,
          ErrorType.Load,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.NotFound,
          ErrorType.Update,
        ),
        props.getRedirectionLocationOnError?.(
          HttpStatusCode.InternalServerError,
          ErrorType.Update,
        ),
      ],
      notificationCalls: vi.mocked(setDashboardNotification).mock.calls,
    }).toMatchObject({
      saveCall: [
        'Q-4',
        {
          applicationId: 'Q-4',
          formStep: summary,
          isCompletingStep: true,
        },
        abortSignal,
      ],
      sessionCalls: [['RFQ-NUM-4', 'accepted-quote-id']],
      redirects: ['/request-for-quote/Q-4/view-summary', '/', undefined],
      notificationCalls: [
        [
          expect.objectContaining({
            message: expect.stringContaining('already been deleted'),
          }),
        ],
      ],
    });
  });

  it('throws load/save errors when no account is available', async () => {
    expect.hasAssertions();

    const deliveryProps = deliveryAndReturnProps(
      'Q-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const paymentProps = paymentDetailsProps(
      'Q-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const recipientProps = reportRecipientProps(
      'Q-5',
      'RFQ-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const summaryProps = summaryAndAcceptProps(
      'Q-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );

    const rejectionMessage = async (invoke: () => unknown) => {
      try {
        await invoke();
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };

    await expect(
      Promise.all([
        rejectionMessage(() => deliveryProps.loadStepValues?.()),
        rejectionMessage(() => deliveryProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => paymentProps.loadStepValues?.()),
        rejectionMessage(() => paymentProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => recipientProps.loadStepValues?.()),
        rejectionMessage(() => recipientProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => summaryProps.loadStepValues?.()),
        rejectionMessage(() => summaryProps.onSaveAndExit?.({}, false)),
      ]),
    ).resolves.toStrictEqual([
      'There was an error retrieving your details.',
      'No authenticated account available to save form.',
      'There was an error retrieving your details.',
      'No authenticated account available to save form.',
      'There was an error retrieving your details.',
      'No authenticated account available to save form.',
      'There was an error retrieving your details.',
      'No authenticated account available to save form.',
    ]);
  });
});
