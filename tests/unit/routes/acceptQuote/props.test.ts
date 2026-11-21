import { describe, expect, it, vi } from 'vitest';
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
  type DeliveryAndReturnStep,
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

type HideRule<T> = (values: Partial<T>) => boolean;

interface DeliveryAndReturnHidingFields {
  contactHide: HideRule<DeliveryAndReturnStep>;
  contact: { titleOther: HideRule<DeliveryAndReturnStep> };
  returnAddress: HideRule<DeliveryAndReturnStep>;
  carrierHide: HideRule<DeliveryAndReturnStep>;
}

interface PaymentDetailsHidingFields {
  contactHide: HideRule<PaymentDetailsStep>;
  contact: { titleOther: HideRule<PaymentDetailsStep> };
}

interface ReportRecipientHidingFields {
  contact: { titleOther: HideRule<ReportRecipientStep> };
  businessStreetAddress: HideRule<ReportRecipientStep>;
}

interface SummaryAndAcceptHidingFields {
  associatedDispute: HideRule<SummaryAndAcceptStep>;
  reportRecipient: {
    rfqHide: HideRule<SummaryAndAcceptStep>;
    organisationNameHide: HideRule<SummaryAndAcceptStep>;
    contact: { titleOther: HideRule<SummaryAndAcceptStep> };
    recipientMailingAddress: HideRule<SummaryAndAcceptStep>;
  };
  deliveryAndReturn: {
    rfqHide: HideRule<SummaryAndAcceptStep>;
    contactHide: HideRule<SummaryAndAcceptStep>;
    contact: { titleOther: HideRule<SummaryAndAcceptStep> };
  };
  paymentDetails: {
    rfqHide: HideRule<SummaryAndAcceptStep>;
    contactHide: HideRule<SummaryAndAcceptStep>;
    contact: { titleOther: HideRule<SummaryAndAcceptStep> };
  };
  requestForQuote: {
    contact: { titleOther: HideRule<SummaryAndAcceptStep> };
  };
}

const expectStringContaining = (value: string): unknown =>
  expect.stringContaining(value);

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

vi.mock(
  '../../../../ClientApp/src/instrumentation/AppLogger',
  () =>
    ({
      default: {
        error: mocks.appLoggerError,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

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

const resetAcceptQuotePropsMocks = () => {
  vi.clearAllMocks();
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
  mocks.getDeliveryAndReturn.mockResolvedValue({
    returnContactType: 'SamePerson',
  });
  mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
  mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
  mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
};

describe('accept quote wizard prop factories', () => {
  it('loads, saves, hides, and redirects delivery/return branches', async () => {
    expect.hasAssertions();

    resetAcceptQuotePropsMocks();

    const props = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const hidingFields =
      props.hidingFields as unknown as DeliveryAndReturnHidingFields;
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues(abortSignal);

    expect({
      loaded,
      loadCalls: mocks.getDeliveryAndReturn.mock.calls,
      hidden: [
        hidingFields.contactHide({
          returnContactType: ReturnContactTypeValues.SamePerson,
        }),
        hidingFields.contactHide({
          returnContactType: ReturnContactTypeValues.DifferentPerson,
        }),
        hidingFields.contact.titleOther({
          contact: { title: Title.Other },
        }),
        hidingFields.returnAddress({
          returnAddressType: ReturnAddressTypeValues.Other,
        }),
        hidingFields.carrierHide({
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
            message: expectStringContaining(
              'Another person has deleted this request',
            ),
          }),
        ],
      ],
    });
  });

  it('loads and saves payment details while logging load and save failures', async () => {
    expect.hasAssertions();

    resetAcceptQuotePropsMocks();

    const props = paymentDetailsProps(
      'Q-2',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const hidingFields =
      props.hidingFields as unknown as PaymentDetailsHidingFields;
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues(abortSignal);

    expect({
      loaded,
      hidden: [
        hidingFields.contactHide({
          invoiceSentTo: InvoiceSentToValues.SamePerson,
        }),
        hidingFields.contactHide({
          invoiceSentTo: InvoiceSentToValues.DifferentPerson,
        }),
        hidingFields.contact.titleOther({
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
      props.loadStepValues(abortSignal),
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

    resetAcceptQuotePropsMocks();

    const props = reportRecipientProps(
      'Q-3',
      'RFQ-3',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const hidingFields =
      props.hidingFields as unknown as ReportRecipientHidingFields;
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues(abortSignal);

    expect({
      loaded,
      hidden: [
        hidingFields.contact.titleOther({
          contact: { title: Title.Other },
        }),
        hidingFields.businessStreetAddress({
          reportAddressType: ReportAddressTypeValues.Other,
        }),
        hidingFields.businessStreetAddress({
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

    resetAcceptQuotePropsMocks();

    const props = summaryAndAcceptProps(
      'Q-4',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const hidingFields =
      props.hidingFields as unknown as SummaryAndAcceptHidingFields;
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

    const loaded = await props.loadStepValues(abortSignal);

    expect({
      loaded,
      hidden: [
        hidingFields.associatedDispute(summary),
        hidingFields.reportRecipient.rfqHide(summary),
        hidingFields.reportRecipient.organisationNameHide(summary),
        hidingFields.reportRecipient.contact.titleOther(summary),
        hidingFields.reportRecipient.recipientMailingAddress(summary),
        hidingFields.deliveryAndReturn.rfqHide(summary),
        hidingFields.deliveryAndReturn.contactHide(summary),
        hidingFields.deliveryAndReturn.contact.titleOther(summary),
        hidingFields.paymentDetails.rfqHide(summary),
        hidingFields.paymentDetails.contactHide(summary),
        hidingFields.paymentDetails.contact.titleOther(summary),
        hidingFields.requestForQuote.contact.titleOther(summary),
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
            message: expectStringContaining('already been deleted'),
          }),
        ],
      ],
    });
  });

  it('throws load/save errors when no account is available', async () => {
    expect.hasAssertions();

    resetAcceptQuotePropsMocks();

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
        rejectionMessage(() => deliveryProps.loadStepValues()),
        rejectionMessage(() => deliveryProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => paymentProps.loadStepValues()),
        rejectionMessage(() => paymentProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => recipientProps.loadStepValues()),
        rejectionMessage(() => recipientProps.onSaveAndExit?.({}, false)),
        rejectionMessage(() => summaryProps.loadStepValues()),
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

  it('authenticates every client with the acquired access token on each load and save path', async () => {
    expect.hasAssertions();

    resetAcceptQuotePropsMocks();

    const abortSignal = new AbortController().signal;
    const delivery = deliveryAndReturnProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const payment = paymentDetailsProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const recipient = reportRecipientProps(
      'Q-1',
      'Q-REF',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const summary = summaryAndAcceptProps(
      'Q-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Accept quote',
    );
    const token = ['access-token'];
    const operations: [string, () => unknown][] = [
      ['delivery and return load', () => delivery.loadStepValues(abortSignal)],
      [
        'delivery and return save',
        () => Promise.resolve(delivery.onSaveAndNext?.({}, true, abortSignal)),
      ],
      ['payment details load', () => payment.loadStepValues(abortSignal)],
      [
        'payment details save',
        () => Promise.resolve(payment.onSaveAndNext?.({}, true, abortSignal)),
      ],
      ['report recipient load', () => recipient.loadStepValues(abortSignal)],
      [
        'report recipient save',
        () => Promise.resolve(recipient.onSaveAndNext?.({}, true, abortSignal)),
      ],
      ['summary and accept load', () => summary.loadStepValues(abortSignal)],
      [
        'summary and accept save',
        () => Promise.resolve(summary.onSaveAndNext?.({}, true, abortSignal)),
      ],
    ];

    for (const [name, operation] of operations) {
      mocks.setAuthToken.mockClear();
      await operation();

      expect({
        name,
        calls: mocks.setAuthToken.mock.calls,
      }).toStrictEqual({
        name,
        calls: [token],
      });
    }
  });
});
