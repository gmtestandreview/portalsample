import { describe, expect, it, vi } from 'vitest';
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
  Title,
  YesNo,
  type InstrumentAndRequestStep,
  type OrganisationAndContact,
  type RequestForQuoteSummary,
} from '../../../../ClientApp/src/api/web-api-client';
import { stepStatuses } from '../testFixtures';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getInstrumentAndRequest: vi.fn<(...args: unknown[]) => unknown>(),
  saveInstrumentAndRequest: vi.fn<(...args: unknown[]) => unknown>(),
  getOrganisationAndContact: vi.fn<(...args: unknown[]) => unknown>(),
  saveOrganisationAndContact: vi.fn<(...args: unknown[]) => unknown>(),
  getSummary: vi.fn<(...args: unknown[]) => unknown>(),
  getSubmittedSummary: vi.fn<(...args: unknown[]) => unknown>(),
  submit: vi.fn<(...args: unknown[]) => unknown>(),
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
}));

type HideRule<T> = (values: Partial<T>) => boolean;

interface InstrumentAndRequestHidingFields {
  serialNumber: HideRule<InstrumentAndRequestStep>;
}

interface OrganisationAndContactHidingFields {
  businessOrTradingName: HideRule<OrganisationAndContact>;
  branchOrLocationName: HideRule<OrganisationAndContact>;
  principalContactHide: HideRule<OrganisationAndContact>;
  contact: { titleOther: HideRule<OrganisationAndContact> };
}

interface RequestForQuoteSummaryHidingFields {
  organisationAndContact: {
    branchOrLocationName: HideRule<RequestForQuoteSummary>;
    principalContactHide: HideRule<RequestForQuoteSummary>;
    contact: { titleOther: HideRule<RequestForQuoteSummary> };
  };
}

const expectObjectContaining = (value: object): unknown =>
  expect.objectContaining(value);

vi.mock(import('../../../../ClientApp/src/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const actual = await importOriginal();
  if (typeof actual !== 'object' || actual === null) {
    throw new TypeError('Expected module exports object');
  }
  return {
    ...actual,
    RequestForQuoteClient: vi.fn<(...args: unknown[]) => unknown>(
      function RequestForQuoteClientMock() {
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
      },
    ),
  } satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

vi.mock(
  import('../../../../ClientApp/src/authentication/authConfig'),
  (() =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>) as unknown as __DynamicPartialMockFactory<__TestMockModule8>,
);

vi.mock(
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: mocks.appLoggerError,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
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

const resetRequestForQuotePropsMocks = () => {
  vi.clearAllMocks();
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
  mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
  mocks.getOrganisationAndContact.mockResolvedValue({
    isPrincipalContact: YesNo.No,
  });
  mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
  mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
};

describe('request for quote wizard prop factories', () => {
  it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const hidingFields =
      props.hidingFields as unknown as InstrumentAndRequestHidingFields;
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      setAuthTokenCalls: mocks.setAuthToken.mock.calls,
      loadCalls: mocks.getInstrumentAndRequest.mock.calls,
      serialNumberHidden: [
        hidingFields.serialNumber({ hasSerialNumber: YesNo.No }),
        hidingFields.serialNumber({ hasSerialNumber: YesNo.Yes }),
      ],
      bannerRefTitle: props.bannerRefTitle,
      bannerSubTitle: props.bannerSubTitle,
    }).toStrictEqual({
      loaded: { stepValues: { instrument: 'Balance' } },
      setAuthTokenCalls: [['access-token']],
      loadCalls: [['APP-1', abortSignal]],
      serialNumberHidden: [true, false],
      bannerRefTitle: 'Ref ID: APP-1',
      bannerSubTitle: 'Trading - Branch - National Measurement Institute',
    });

    await props.onSaveAndNext?.(
      {
        hasSerialNumber: YesNo.Yes,
        preferredInstrumentOrArtefactAvailabilityDate: new Date(
          '2026-06-12T00:00:00Z',
        ),
      },
      true,
      abortSignal,
    );

    expect(mocks.saveInstrumentAndRequest.mock.calls[0]).toStrictEqual([
      'APP-1',
      {
        applicationId: 'APP-1',
        formStep: expectObjectContaining({
          preferredInstrumentOrArtefactAvailabilityDate: new Date(
            '2026-06-12T00:00:00.000Z',
          ),
        }),
        isCompletingStep: true,
      },
      abortSignal,
    ]);

    await props.onSaveAndExit?.(
      { hasSerialNumber: YesNo.No },
      false,
      abortSignal,
    );

    expect(mocks.saveInstrumentAndRequest.mock.calls.at(-1)).toStrictEqual([
      'APP-1',
      {
        applicationId: 'APP-1',
        formStep: { hasSerialNumber: YesNo.No },
        isCompletingStep: false,
      },
      abortSignal,
    ]);
  });

  it('sends an unparseable availability date through unchanged', async () => {
    // The date is normalised to the API's calendar form when it can be read. When it cannot,
    // the original value is forwarded rather than silently dropped, so the server decides.
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const props = instrumentAndRequestProps(
      'APP-1',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const abortSignal = new AbortController().signal;

    await props.onSaveAndNext?.(
      {
        hasSerialNumber: YesNo.Yes,
        preferredInstrumentOrArtefactAvailabilityDate:
          'not a date' as unknown as Date,
      },
      true,
      abortSignal,
    );

    expect(mocks.saveInstrumentAndRequest).toHaveBeenLastCalledWith(
      'APP-1',
      {
        applicationId: 'APP-1',
        formStep: expectObjectContaining({
          preferredInstrumentOrArtefactAvailabilityDate: 'not a date',
        }),
        isCompletingStep: true,
      },
      abortSignal,
    );
  });

  it('loads and saves organisation/contact values and reports not-found redirects', async () => {
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const props = organisationAndContactProps(
      'APP-2',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const hidingFields =
      props.hidingFields as unknown as OrganisationAndContactHidingFields;
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      loadCalls: mocks.getOrganisationAndContact.mock.calls,
      hidden: [
        hidingFields.businessOrTradingName({}),
        hidingFields.branchOrLocationName({}),
        hidingFields.principalContactHide({
          isPrincipalContact: YesNo.Yes,
        }),
        hidingFields.principalContactHide({
          isPrincipalContact: YesNo.No,
        }),
        hidingFields.contact.titleOther({
          contact: { title: Title.Other },
        }),
        hidingFields.contact.titleOther({ contact: { title: Title.Dr } }),
      ],
      redirect: props.getRedirectionLocationOnError?.(500, ErrorType.Load),
    }).toStrictEqual({
      loaded: { stepValues: { isPrincipalContact: YesNo.No } },
      loadCalls: [['APP-2', abortSignal]],
      hidden: [false, false, true, false, false, true],
      redirect: '/not-found',
    });

    await props.onSaveAndExit?.(
      { isPrincipalContact: YesNo.No },
      true,
      abortSignal,
    );

    expect(mocks.saveOrganisationAndContact.mock.calls.at(-1)).toStrictEqual([
      'APP-2',
      {
        applicationId: 'APP-2',
        formStep: { isPrincipalContact: YesNo.No },
        isCompletingStep: false,
      },
      abortSignal,
    ]);
  });

  it('loads, submits, and logs request-for-quote summary failures', async () => {
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const props = requestForQuoteSummaryProps(
      'APP-3',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const hidingFields =
      props.hidingFields as unknown as RequestForQuoteSummaryHidingFields;
    const abortSignal = new AbortController().signal;
    const summary = {
      organisationAndContact: {
        contact: { title: 'Dr' },
      },
    } as RequestForQuoteSummary;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      loadCalls: mocks.getSummary.mock.calls,
      hidden: [
        hidingFields.organisationAndContact.branchOrLocationName(summary),
        hidingFields.organisationAndContact.principalContactHide(summary),
        hidingFields.organisationAndContact.contact.titleOther(summary),
      ],
      redirect: props.getRedirectionLocationOnError?.(404, ErrorType.Load),
    }).toStrictEqual({
      loaded: { stepValues: { referenceId: 'RFQ-1' } },
      loadCalls: [['APP-3', abortSignal]],
      hidden: [true, false, true],
      redirect: '/not-found',
    });

    await props.onSaveAndNext?.(summary, true, abortSignal);

    expect(mocks.submit.mock.calls.at(-1)).toStrictEqual([
      'APP-3',
      {
        applicationId: 'APP-3',
        formStep: summary,
        isCompletingStep: true,
      },
      abortSignal,
    ]);

    mocks.submit.mockRejectedValueOnce(new Error('submit failed'));

    const submitFailure: unknown = await props.onSaveAndNext?.(
      summary,
      true,
      abortSignal,
    );

    const submitLoggerCall: unknown = mocks.appLoggerError.mock.calls.at(-1);

    expect({
      result: submitFailure,
      loggerCall: submitLoggerCall,
    }).toStrictEqual({
      result: undefined,
      loggerCall: [
        'failoed to submit form',
        expect.any(Error),
        { Id: 'APP-3' },
      ],
    });

    mocks.getSummary.mockRejectedValueOnce(new Error('load failed'));

    const loadFailure = await Promise.resolve(
      props.loadStepValues?.(abortSignal),
    ).catch((error: unknown) => error);

    const loadLoggerCall: unknown = mocks.appLoggerError.mock.calls.at(-1);

    expect({
      error: loadFailure,
      loggerCall: loadLoggerCall,
    }).toStrictEqual({
      error: expectObjectContaining({
        message: 'There was an error retrieving your details.',
      }),
      loggerCall: [
        'Failed to load summary',
        expect.any(Error),
        { Id: 'APP-3' },
      ],
    });
  });

  it('loads and submits the submitted summary view', async () => {
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const props = viewRequestForQuoteSummaryProps(
      'APP-4',
      accounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const hidingFields =
      props.hidingFields as unknown as RequestForQuoteSummaryHidingFields;
    const abortSignal = new AbortController().signal;
    const summary = {
      organisationAndContact: {
        branchOrLocationName: 'Branch',
        contact: { title: 'Other' },
      },
    } as RequestForQuoteSummary;

    const loaded = await props.loadStepValues?.(abortSignal);

    expect({
      loaded,
      loadCalls: mocks.getSubmittedSummary.mock.calls,
      hidden: [
        hidingFields.organisationAndContact.branchOrLocationName(summary),
        hidingFields.organisationAndContact.contact.titleOther(summary),
      ],
      redirect: props.getRedirectionLocationOnError?.(404, ErrorType.Load),
    }).toStrictEqual({
      loaded: { stepValues: { referenceId: 'RFQ-2' } },
      loadCalls: [['APP-4', abortSignal]],
      hidden: [false, false],
      redirect: '/not-found',
    });

    await props.onSaveAndNext?.(summary, false, abortSignal);

    expect(mocks.submit.mock.calls.at(-1)).toStrictEqual([
      'APP-4',
      {
        applicationId: 'APP-4',
        formStep: summary,
        isCompletingStep: true,
      },
      abortSignal,
    ]);
  });

  it('throws load/save errors when no account is available', async () => {
    expect.hasAssertions();

    resetRequestForQuotePropsMocks();

    const instrumentProps = instrumentAndRequestProps(
      'APP-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const organisationProps = organisationAndContactProps(
      'APP-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const summaryProps = requestForQuoteSummaryProps(
      'APP-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );
    const viewSummaryProps = viewRequestForQuoteSummaryProps(
      'APP-5',
      emptyAccounts,
      instance,
      accountDetails,
      statuses,
      'Request quote',
    );

    const failures = await Promise.all(
      [
        Promise.resolve(instrumentProps.loadStepValues?.()),
        Promise.resolve(instrumentProps.onSaveAndExit?.({}, false)),
        Promise.resolve(organisationProps.loadStepValues?.()),
        Promise.resolve(organisationProps.onSaveAndExit?.({}, false)),
        Promise.resolve(summaryProps.loadStepValues?.()),
        Promise.resolve(summaryProps.onSaveAndNext?.({}, false)),
        Promise.resolve(viewSummaryProps.loadStepValues?.()),
        Promise.resolve(viewSummaryProps.onSaveAndNext?.({}, false)),
      ].map((promise) =>
        promise.then(
          () => undefined,
          (error: unknown) => error,
        ),
      ),
    );

    expect(failures.map((error) => (error as Error).message)).toStrictEqual([
      'There was an error retrieving your details.',
      'error',
      'There was an error retrieving your details.',
      'error',
      'There was an error retrieving your details.',
      'error',
      'There was an error retrieving your details.',
      'error',
    ]);
  });
});
