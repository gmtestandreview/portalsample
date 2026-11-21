import { describe, expect, it, vi } from 'vitest';
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
  Title,
  YesNo,
} from '../../../../../ClientApp/src/api/web-api-client';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getAppDetails: vi.fn<(...args: unknown[]) => unknown>(),
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerVerbose: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(import('../../../../../ClientApp/src/api/web-api-client'), (async (
  importOriginal: Parameters<__DynamicPartialMockFactory<__TestMockModule4>>[0],
) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    RequestForPatternApprovalClient: vi.fn<(...args: unknown[]) => unknown>(
      function RequestForPatternApprovalClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getAppDetails: mocks.getAppDetails,
        };
      },
    ),
  } satisfies __ExactMockModule<__TestMockModule4>;
}) as unknown as __DynamicPartialMockFactory<__TestMockModule4>);

vi.mock(
  import('../../../../../ClientApp/src/authentication/authConfig'),
  (() =>
    ({
      tokenRequest: { scopes: ['scope'] },
    }) satisfies __ExactMockModule<__TestMockModule8>) as unknown as __DynamicPartialMockFactory<__TestMockModule8>,
);

vi.mock(
  import('../../../../../ClientApp/src/instrumentation/AppLogger'),
  (() =>
    ({
      default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
      },
    }) satisfies __ExactMockModule<__TestMockModule5>) as unknown as __DynamicPartialMockFactory<__TestMockModule5>,
);

const accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];
const emptyAccounts = [] as AccountInfo[];
const instance = {
  acquireTokenSilent: mocks.acquireTokenSilent,
} as unknown as IPublicClientApplication;

const resetAppDetailsPropsMocks = () => {
  vi.clearAllMocks();
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
  mocks.getAppDetails.mockResolvedValue({
    applicationDetails: { referenceId: 'PA-1' },
  });
};

interface AppDetailsHidingFields {
  organisationAndContact: {
    branchOrLocationName: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    isManufacturerHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    principalInvoiceContactHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    isCurrentOrganisationHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    contact: {
      titleOther: (
        values: Partial<RequestForPatternApprovalAppDetails>,
      ) => boolean;
    };
    invoiceContact: {
      titleOther: (
        values: Partial<RequestForPatternApprovalAppDetails>,
      ) => boolean;
    };
  };
  applicationAndInstrument: {
    isApplNewHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    isApplVariationHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    isApplOtherHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
    isApplOIMLHide: (
      values: Partial<RequestForPatternApprovalAppDetails>,
    ) => boolean;
  };
}

// function suite titles are required by vitest/prefer-describe-function-title.
describe(appDetailsProps, () => {
  it('loads app details and exposes summary hiding rules', async () => {
    expect.hasAssertions();

    resetAppDetailsPropsMocks();

    const props = appDetailsProps('PA-1', accounts, instance);
    const abortSignal = new AbortController().signal;

    const loaded = await props.loadStepValues(abortSignal);

    expect({
      loaded,
      setAuthTokenCalls: mocks.setAuthToken.mock.calls,
      getAppDetailsCalls: mocks.getAppDetails.mock.calls,
      location: props.location,
      title: props.title,
      isSummaryPage: props.isSummaryPage,
    }).toStrictEqual({
      loaded: { formValues: { applicationDetails: { referenceId: 'PA-1' } } },
      setAuthTokenCalls: [['access-token']],
      getAppDetailsCalls: [['PA-1', abortSignal]],
      location: '/summary',
      title: 'Summary and submit',
      isSummaryPage: true,
    });

    // WizardStepProps retains a legacy union for hidingFields; this factory
    // supplies the narrower runtime shape used by this test.
    const hidingFields =
      props.hidingFields as unknown as AppDetailsHidingFields;

    expect({
      branchEmpty: hidingFields.organisationAndContact.branchOrLocationName({
        organisationAndContact: {},
      }),
      branchFilled: hidingFields.organisationAndContact.branchOrLocationName({
        organisationAndContact: { branchOrLocationName: 'Branch' },
      }),
      manufacturerYes: hidingFields.organisationAndContact.isManufacturerHide({
        organisationAndContact: { isManufacturer: YesNo.Yes },
      }),
      manufacturerNo: hidingFields.organisationAndContact.isManufacturerHide({
        organisationAndContact: { isManufacturer: YesNo.No },
      }),
      manufacturerMissing:
        hidingFields.organisationAndContact.isManufacturerHide({
          organisationAndContact: { isManufacturer: undefined },
        }),
      invoiceContactYes:
        hidingFields.organisationAndContact.principalInvoiceContactHide({
          organisationAndContact: { isPrincipalInvoiceContact: YesNo.Yes },
        }),
      invoiceContactNo:
        hidingFields.organisationAndContact.principalInvoiceContactHide({
          organisationAndContact: { isPrincipalInvoiceContact: YesNo.No },
        }),
      invoiceContactMissing:
        hidingFields.organisationAndContact.principalInvoiceContactHide({
          organisationAndContact: { isPrincipalInvoiceContact: undefined },
        }),
      currentOrganisationNo:
        hidingFields.organisationAndContact.isCurrentOrganisationHide({
          organisationAndContact: { isManufacturer: YesNo.No },
        }),
      currentOrganisationYes:
        hidingFields.organisationAndContact.isCurrentOrganisationHide({
          organisationAndContact: { isManufacturer: YesNo.Yes },
        }),
      contactOther: hidingFields.organisationAndContact.contact.titleOther({
        organisationAndContact: { contact: { title: Title.Other } },
      }),
      contactDr: hidingFields.organisationAndContact.contact.titleOther({
        organisationAndContact: { contact: { title: Title.Dr } },
      }),
      invoiceOther:
        hidingFields.organisationAndContact.invoiceContact.titleOther({
          organisationAndContact: { invoiceContact: { title: Title.Other } },
        }),
      invoiceDr: hidingFields.organisationAndContact.invoiceContact.titleOther({
        organisationAndContact: { invoiceContact: { title: Title.Dr } },
      }),
      newCertificate: hidingFields.applicationAndInstrument.isApplNewHide({
        applicationAndInstrument: {
          patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        },
      }),
      otherApprovalForNew: hidingFields.applicationAndInstrument.isApplNewHide({
        applicationAndInstrument: {
          patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        },
      }),
      variation: hidingFields.applicationAndInstrument.isApplVariationHide({
        applicationAndInstrument: {
          patternApprovalType: PatternApprovalRequiredValues.Variation,
        },
      }),
      variationMissing:
        hidingFields.applicationAndInstrument.isApplVariationHide({
          applicationAndInstrument: { patternApprovalType: undefined },
        }),
      otherApproval: hidingFields.applicationAndInstrument.isApplOtherHide({
        applicationAndInstrument: {
          patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        },
      }),
      otherApprovalForNewType:
        hidingFields.applicationAndInstrument.isApplOtherHide({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
          },
        }),
      oiml: hidingFields.applicationAndInstrument.isApplOIMLHide({
        applicationAndInstrument: {
          newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
        },
      }),
      oimlMissing: hidingFields.applicationAndInstrument.isApplOIMLHide({}),
    }).toStrictEqual({
      branchEmpty: true,
      branchFilled: false,
      manufacturerYes: true,
      manufacturerNo: false,
      manufacturerMissing: true,
      invoiceContactYes: true,
      invoiceContactNo: false,
      invoiceContactMissing: true,
      currentOrganisationNo: true,
      currentOrganisationYes: false,
      contactOther: false,
      contactDr: true,
      invoiceOther: false,
      invoiceDr: true,
      newCertificate: false,
      otherApprovalForNew: true,
      variation: false,
      variationMissing: true,
      otherApproval: false,
      otherApprovalForNewType: true,
      oiml: false,
      oimlMissing: true,
    });
  });

  it('logs and rethrows app details load failures', async () => {
    expect.hasAssertions();

    resetAppDetailsPropsMocks();

    mocks.getAppDetails.mockRejectedValueOnce(new Error('load failed'));
    const props = appDetailsProps('PA-2', accounts, instance);

    await expect(props.loadStepValues()).rejects.toThrow(
      'Failed to load app details. Id: PA-2',
    );
    expect(mocks.appLoggerError).toHaveBeenCalledWith(
      'Failed to load app details',
      expect.any(Error),
      { Id: 'PA-2' },
    );
  });

  it('throws before loading when no account is available', async () => {
    expect.hasAssertions();

    resetAppDetailsPropsMocks();

    const props = appDetailsProps('PA-3', emptyAccounts, instance);

    await expect(props.loadStepValues()).rejects.toThrow(
      'There are no accounts available to load app details. Id: PA-3',
    );
    expect(mocks.appLoggerVerbose).toHaveBeenCalledWith(
      'There are no accounts available to load app details',
      {
        Id: 'PA-3',
        Accounts: emptyAccounts,
      },
    );
    expect(mocks.getAppDetails).not.toHaveBeenCalled();
  });

  it('returns loaded values without mutating the client response', async () => {
    expect.hasAssertions();

    resetAppDetailsPropsMocks();

    const appDetails: RequestForPatternApprovalAppDetails = {
      applicationDetails: { referenceId: 'PA-4' },
      organisationAndContact: { isManufacturer: YesNo.Yes },
    };
    mocks.getAppDetails.mockResolvedValueOnce(appDetails);

    await expect(
      appDetailsProps('PA-4', accounts, instance).loadStepValues(),
    ).resolves.toStrictEqual({
      formValues: {
        applicationDetails: { referenceId: 'PA-4' },
        organisationAndContact: { isManufacturer: YesNo.Yes },
      },
    });
    expect(appDetails).toStrictEqual({
      applicationDetails: { referenceId: 'PA-4' },
      organisationAndContact: { isManufacturer: YesNo.Yes },
    });
  });

  it('throws when no application id is provided', async () => {
    expect.hasAssertions();

    resetAppDetailsPropsMocks();

    await expect(
      appDetailsProps(undefined, accounts, instance).loadStepValues(),
    ).rejects.toThrow('No application id is available to load app details.');
    expect(mocks.getAppDetails).not.toHaveBeenCalled();
  });
});
