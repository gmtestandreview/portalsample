import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AccountInfo,
  IPublicClientApplication,
} from '@azure/msal-browser';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';
import type { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';
import applicationAndInstrumentProps from '../../../../ClientApp/src/routes/ta/applicationAndInstrumentProps';
import organisationAndContactProps from '../../../../ClientApp/src/routes/ta/organisationAndContactProps';
import supportingDocumentsProps from '../../../../ClientApp/src/routes/ta/supportingDocumentsProps';
import summaryAndSubmitProps from '../../../../ClientApp/src/routes/ta/summaryAndSubmitProps';
import type { RequestForPatternApprovalSummaryDto } from '../../../../ClientApp/src/routes/ta/types';
import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';
import {
  CRMLookupTypes,
  PatternApprovalRequiredValueOptions,
  PatternApprovalRequiredValues,
  type RequestForPatternApprovalSummary,
  type SupportingDocumentsStep,
  YesNo,
} from '../../../../ClientApp/src/api/web-api-client';
import { stepStatuses } from '../testFixtures';

const mocks = vi.hoisted(() => ({
  setAuthToken: vi.fn<(...args: unknown[]) => unknown>(),
  getLookup:
    vi.fn<
      (
        type: CRMLookupTypes,
      ) => Promise<Array<{ id: CRMLookupTypes; name: CRMLookupTypes }>>
    >(),
  getAllInfoPanelContent: vi.fn<(...args: unknown[]) => unknown>(),
  getNmiApplication: vi.fn<(...args: unknown[]) => unknown>(),
  getApplicationAndInstrument: vi.fn<(...args: unknown[]) => unknown>(),
  saveApplicationAndInstrument: vi.fn<(...args: unknown[]) => unknown>(),
  getOrganisationAndContact: vi.fn<(...args: unknown[]) => unknown>(),
  saveOrganisationAndContact: vi.fn<(...args: unknown[]) => unknown>(),
  getSupportingDocuments: vi.fn<(...args: unknown[]) => unknown>(),
  saveSupportingDocuments: vi.fn<(...args: unknown[]) => unknown>(),
  getSummary: vi.fn<(...args: unknown[]) => unknown>(),
  submit: vi.fn<(...args: unknown[]) => unknown>(),
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerError: vi.fn<(...args: unknown[]) => unknown>(),
  appLoggerVerbose: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  '../../../../ClientApp/src/api/web-api-client',
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      LookupClient: vi.fn<(...args: unknown[]) => unknown>(
        function LookupClientMock() {
          return {
            setAuthToken: mocks.setAuthToken,
            getLookup: mocks.getLookup,
            getAllInfoPanelContent: mocks.getAllInfoPanelContent,
            getNmiApplication: mocks.getNmiApplication,
          };
        },
      ),
      RequestForPatternApprovalClient: vi.fn<(...args: unknown[]) => unknown>(
        function RequestForPatternApprovalClientMock() {
          return {
            setAuthToken: mocks.setAuthToken,
            getApplicationAndInstrument: mocks.getApplicationAndInstrument,
            saveApplicationAndInstrument: mocks.saveApplicationAndInstrument,
            getOrganisationAndContact: mocks.getOrganisationAndContact,
            saveOrganisationAndContact: mocks.saveOrganisationAndContact,
            getSupportingDocuments: mocks.getSupportingDocuments,
            saveSupportingDocuments: mocks.saveSupportingDocuments,
            getSummary: mocks.getSummary,
            submit: mocks.submit,
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
  '../../../../ClientApp/src/instrumentation/AppLogger',
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
const accountDetails = {
  organisation: 'National Measurement Institute',
  trading: 'Trading',
  branch: 'Branch',
} as AccountDetails;

describe('pattern approval wizard prop factories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
    mocks.getLookup.mockImplementation((type: CRMLookupTypes) =>
      Promise.resolve([{ id: type, name: type }]),
    );
    mocks.getAllInfoPanelContent.mockResolvedValue([
      { instrumentTypeId: 'type-1' },
    ]);
    mocks.getNmiApplication.mockResolvedValue([
      { id: 'cert-1', name: 'NMI-1' },
    ]);
    mocks.getApplicationAndInstrument.mockResolvedValue({
      patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
    });
    mocks.getOrganisationAndContact.mockResolvedValue({
      isManufacturer: YesNo.No,
    });
    mocks.getSupportingDocuments.mockResolvedValue({ form: { documents: [] } });
    mocks.getSummary.mockResolvedValue({
      referenceId: 'PA-1',
      applicationAndInstrument: {
        patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
      },
    });
  });

  it('loads and saves application/instrument details while stripping lookup-only values', async () => {
    expect.hasAssertions();

    const props = applicationAndInstrumentProps(
      'PA-1',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;

    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        instrumentCategoryLookup: [
          {
            id: CRMLookupTypes.PAPortalCategory,
            name: CRMLookupTypes.PAPortalCategory,
          },
        ],
        instrumentTypeLookup: [
          {
            id: CRMLookupTypes.PAPortalInstrumentType,
            name: CRMLookupTypes.PAPortalInstrumentType,
          },
        ],
        instrumentTypeContent: [{ instrumentTypeId: 'type-1' }],
        certNameOptions: [{ id: 'cert-1', name: 'NMI-1' }],
      },
    });
    expect({
      applicationAndInstrumentCall:
        mocks.getApplicationAndInstrument.mock.calls.at(-1),
      bannerRefTitle: props.bannerRefTitle,
      bannerSubTitle: props.bannerSubTitle,
      hidingFields: [
        props.hidingFields?.isApplNewHide?.({
          patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        }),
        props.hidingFields?.isApplNewInstrumentHide?.({
          patternApprovalType: PatternApprovalRequiredValues.Variation,
        }),
        props.hidingFields?.isApplVariationHide?.({
          patternApprovalType: PatternApprovalRequiredValues.Variation,
        }),
        props.hidingFields?.isApplOtherHide?.({
          patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
        }),
        props.hidingFields?.isApplOIMLHide?.({
          newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
          instrumentCategory: 'category-1',
          instrumentType: 'type-1',
          instrumentTypeContent: [
            {
              instrumentCategoryId: 'category-1',
              instrumentTypeId: 'type-1',
              eligibleForOiml: false,
            },
          ],
        }),
      ],
    }).toStrictEqual({
      applicationAndInstrumentCall: ['PA-1', abortSignal],
      bannerRefTitle: 'Ref ID: PA-1',
      bannerSubTitle: 'Trading - Branch - National Measurement Institute',
      hidingFields: [false, true, false, false, false],
    });

    await props.onSaveAndNext?.(
      {
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
        instrumentCategoryLookup: [{ id: 'category-1', label: 'Category 1' }],
        instrumentTypeLookup: [{ id: 'type-1', label: 'Type 1' }],
        instrumentTypeContent: [{ instrumentTypeId: 'type-1' }],
        certNameOptions: [{ id: 'cert-1', label: 'Certificate 1' }],
      },
      true,
      abortSignal,
    );

    expect(mocks.saveApplicationAndInstrument).toHaveBeenCalledWith(
      'PA-1',
      {
        applicationId: 'PA-1',
        formStep: {
          patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
          instrumentCategoryLookup: undefined,
          instrumentTypeLookup: undefined,
          instrumentTypeContent: undefined,
          certNameOptions: undefined,
        },
        isCompletingStep: true,
      },
      abortSignal,
    );

    await props.onSaveAndExit?.(
      { patternApprovalType: PatternApprovalRequiredValues.Variation },
      false,
      abortSignal,
    );

    expect(mocks.saveApplicationAndInstrument).toHaveBeenLastCalledWith(
      'PA-1',
      {
        applicationId: 'PA-1',
        formStep: {
          patternApprovalType: PatternApprovalRequiredValues.Variation,
          instrumentCategoryLookup: undefined,
          instrumentTypeLookup: undefined,
          instrumentTypeContent: undefined,
          certNameOptions: undefined,
        },
        isCompletingStep: false,
      },
      abortSignal,
    );
  });

  it('loads and saves organisation/contact details with all hide branches', async () => {
    expect.hasAssertions();

    const props = organisationAndContactProps(
      'PA-2',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;

    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: { isManufacturer: YesNo.No },
    });
    expect({
      organisationAndContactCall:
        mocks.getOrganisationAndContact.mock.calls.at(-1),
      hidingFields: [
        props.hidingFields?.isManufacturerHide?.({
          isManufacturer: YesNo.Yes,
        }),
        props.hidingFields?.isManufacturerHide?.({
          isManufacturer: YesNo.No,
        }),
        props.hidingFields?.isManufacturerHide?.({
          isManufacturer: undefined,
        }),
        props.hidingFields?.isCurrentOrganisationHide?.({}),
        props.hidingFields?.principalContactHide?.({
          isPrincipalContact: YesNo.Yes,
        }),
        props.hidingFields?.principalContactHide?.({
          isPrincipalContact: YesNo.No,
        }),
        props.hidingFields?.principalContactHide?.({
          isPrincipalContact: undefined,
        }),
        props.hidingFields?.principalInvoiceContactHide?.({
          isPrincipalInvoiceContact: YesNo.Yes,
        }),
        props.hidingFields?.principalInvoiceContactHide?.({
          isPrincipalInvoiceContact: YesNo.No,
        }),
        props.hidingFields?.principalInvoiceContactHide?.({
          isPrincipalInvoiceContact: undefined,
        }),
        props.hidingFields?.contact?.titleOther?.({
          contact: { title: 'Other' },
        }),
        props.hidingFields?.contact?.titleOther?.({ contact: { title: 'Dr' } }),
        props.hidingFields?.invoiceContact?.titleOther?.({
          invoiceContact: { title: 'Other' },
        }),
        props.hidingFields?.invoiceContact?.titleOther?.({
          invoiceContact: { title: 'Dr' },
        }),
      ],
      redirect: props.getRedirectionLocationOnError?.(404, {} as ErrorType),
    }).toStrictEqual({
      organisationAndContactCall: ['PA-2', abortSignal],
      hidingFields: [
        true,
        false,
        true,
        true,
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
      ],
      redirect: '/not-found',
    });

    await props.onSaveAndExit?.(
      { isManufacturer: YesNo.No },
      false,
      abortSignal,
    );

    expect(mocks.saveOrganisationAndContact.mock.calls.at(-1)).toStrictEqual([
      'PA-2',
      {
        applicationId: 'PA-2',
        formStep: { isManufacturer: YesNo.No },
        isCompletingStep: false,
      },
      abortSignal,
    ]);

    await props.onSaveAndNext?.(
      { isManufacturer: YesNo.Yes },
      true,
      abortSignal,
    );

    expect(mocks.saveOrganisationAndContact.mock.calls.at(-1)).toStrictEqual([
      'PA-2',
      {
        applicationId: 'PA-2',
        formStep: { isManufacturer: YesNo.Yes },
        isCompletingStep: true,
      },
      abortSignal,
    ]);
  });

  it('loads and saves supporting documents with document-list branches', async () => {
    expect.hasAssertions();

    const props = supportingDocumentsProps(
      'PA-3',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;

    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: { form: { documents: [] } },
    });
    expect({
      supportingDocumentsCall: mocks.getSupportingDocuments.mock.calls.at(-1),
      discard: props.discard,
      redirect: props.getRedirectionLocationOnError?.(404, {} as ErrorType),
      isSummaryPage: props.isSummaryPage,
      suppressErrorSummary: props['suppressErrorSummary'],
      suppressErrorSummaryPath: props['suppressErrorSummaryPath'],
    }).toStrictEqual({
      supportingDocumentsCall: ['PA-3', abortSignal],
      discard: { locationOnDiscard: '/', showCancelButton: false },
      redirect: '/not-found',
      isSummaryPage: true,
      suppressErrorSummary: true,
      suppressErrorSummaryPath: true,
    });

    const documents: SupportingDocumentsStep = {
      form: {
        documents: [
          { attachmentName: 'manual.pdf', attachmentCategory: 'Manual' },
        ],
      },
    };
    await props.onSaveAndNext?.(documents, true, abortSignal);

    expect(mocks.saveSupportingDocuments.mock.calls.at(-1)).toStrictEqual([
      'PA-3',
      {
        applicationId: 'PA-3',
        formStep: documents,
        isCompletingStep: true,
      },
      abortSignal,
    ]);

    const withoutDocuments: SupportingDocumentsStep = { form: {} };
    await props.onSaveAndExit?.(withoutDocuments, false, abortSignal);

    expect(mocks.saveSupportingDocuments.mock.calls.at(-1)).toStrictEqual([
      'PA-3',
      {
        applicationId: 'PA-3',
        formStep: withoutDocuments,
        isCompletingStep: false,
      },
      abortSignal,
    ]);
  });

  it('loads and submits summary values with lookup-enriched application details', async () => {
    expect.hasAssertions();

    const props = summaryAndSubmitProps(
      'PA-4',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;

    await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
      stepValues: {
        referenceId: 'PA-1',
        applicationAndInstrument: {
          patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
          instrumentCategoryLookup: [
            {
              id: CRMLookupTypes.PAPortalCategory,
              name: CRMLookupTypes.PAPortalCategory,
            },
          ],
          instrumentTypeLookup: [
            {
              id: CRMLookupTypes.PAPortalInstrumentType,
              name: CRMLookupTypes.PAPortalInstrumentType,
            },
          ],
        },
      },
    });
    expect({
      summaryCall: mocks.getSummary.mock.calls.at(-1),
      organisationAndContact: [
        props.hidingFields?.organisationAndContact?.branchOrLocationName?.({
          organisationAndContact: {},
        }),
        props.hidingFields?.organisationAndContact?.branchOrLocationName?.({
          organisationAndContact: { branchOrLocationName: 'Branch' },
        }),
        props.hidingFields?.organisationAndContact?.isManufacturerHide?.({
          organisationAndContact: { isManufacturer: YesNo.Yes },
        }),
        props.hidingFields?.organisationAndContact?.isManufacturerHide?.({
          organisationAndContact: { isManufacturer: YesNo.No },
        }),
        props.hidingFields?.organisationAndContact?.isManufacturerHide?.({
          organisationAndContact: { isManufacturer: undefined },
        }),
        props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.(
          { organisationAndContact: { isPrincipalInvoiceContact: YesNo.Yes } },
        ),
        props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.(
          { organisationAndContact: { isPrincipalInvoiceContact: YesNo.No } },
        ),
        props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.(
          { organisationAndContact: { isPrincipalInvoiceContact: undefined } },
        ),
        props.hidingFields?.organisationAndContact?.isCurrentOrganisationHide?.(
          { organisationAndContact: { isManufacturer: YesNo.No } },
        ),
        props.hidingFields?.organisationAndContact?.isCurrentOrganisationHide?.(
          { organisationAndContact: { isManufacturer: YesNo.Yes } },
        ),
        props.hidingFields?.organisationAndContact?.contact?.titleOther?.({
          organisationAndContact: { contact: { title: 'Other' } },
        }),
        props.hidingFields?.organisationAndContact?.contact?.titleOther?.({
          organisationAndContact: { contact: { title: 'Dr' } },
        }),
        props.hidingFields?.organisationAndContact?.invoiceContact?.titleOther?.(
          { organisationAndContact: { invoiceContact: { title: 'Other' } } },
        ),
        props.hidingFields?.organisationAndContact?.invoiceContact?.titleOther?.(
          { organisationAndContact: { invoiceContact: { title: 'Dr' } } },
        ),
      ],
      applicationAndInstrument: [
        props.hidingFields?.applicationAndInstrument?.isApplNewHide?.({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
          },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplNewHide?.({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
          },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplVariationHide?.({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.Variation,
          },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplVariationHide?.({
          applicationAndInstrument: { patternApprovalType: undefined },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplOtherHide?.({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
          },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplOtherHide?.({
          applicationAndInstrument: {
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
          },
        }),
        props.hidingFields?.applicationAndInstrument?.isApplOIMLHide?.({
          newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
        }),
      ],
      redirect: props.getRedirectionLocationOnError?.(404, {} as ErrorType),
      disableLinkedError: props['disableLinkedError'],
      suppressErrorSummaryPath: props['suppressErrorSummaryPath'],
    }).toStrictEqual({
      summaryCall: ['PA-4', abortSignal],
      organisationAndContact: [
        true,
        false,
        true,
        false,
        true,
        true,
        false,
        true,
        true,
        false,
        false,
        true,
        false,
        true,
      ],
      applicationAndInstrument: [false, true, false, true, false, true, false],
      redirect: '/not-found',
      disableLinkedError: false,
      suppressErrorSummaryPath: true,
    });

    const summary: RequestForPatternApprovalSummaryDto = {
      referenceId: 'PA-4',
      acceptNMIP106: true,
      acceptTermsAndConditions: true,
      acceptDeclaration: true,
    };
    await props.onSaveAndNext?.(summary, true, abortSignal);

    expect(mocks.submit).toHaveBeenCalledWith(
      'PA-4',
      {
        applicationId: 'PA-4',
        formStep: summary as RequestForPatternApprovalSummary,
        isCompletingStep: true,
      },
      abortSignal,
    );
  });

  it('logs and rethrows client failures from each async prop helper', async () => {
    expect.hasAssertions();

    const abortSignal = new AbortController().signal;
    const failureCases = [
      {
        operation: () => {
          mocks.getApplicationAndInstrument.mockRejectedValueOnce(
            new Error('load application failed'),
          );
          return applicationAndInstrumentProps(
            'PA-5',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).loadStepValues?.(abortSignal);
        },
        message:
          'Failed to load PA application and instrument details. Id: PA-5',
        logger: 'Failed to load PA application and instrument details',
        id: 'PA-5',
      },
      {
        operation: () => {
          mocks.saveApplicationAndInstrument.mockRejectedValueOnce(
            new Error('save application failed'),
          );
          return applicationAndInstrumentProps(
            'PA-6',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).onSaveAndNext?.({}, true, abortSignal);
        },
        message:
          'Failed to save PA application and instrument details. Id: PA-6',
        logger: 'Failed to save PA application and instrument details',
        id: 'PA-6',
      },
      {
        operation: () => {
          mocks.getOrganisationAndContact.mockRejectedValueOnce(
            new Error('load organisation failed'),
          );
          return organisationAndContactProps(
            'PA-7',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).loadStepValues?.(abortSignal);
        },
        message: 'Failed to load PA org and contact details. Id: PA-7',
        logger: 'Failed to load PA org and contact details',
        id: 'PA-7',
      },
      {
        operation: () => {
          mocks.saveOrganisationAndContact.mockRejectedValueOnce(
            new Error('save organisation failed'),
          );
          return organisationAndContactProps(
            'PA-8',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).onSaveAndNext?.({}, true, abortSignal);
        },
        message: 'Failed to save PA org and contact details. Id: PA-8',
        logger: 'Failed to save PA org and contact details',
        id: 'PA-8',
      },
      {
        operation: () => {
          mocks.getSupportingDocuments.mockRejectedValueOnce(
            new Error('load documents failed'),
          );
          return supportingDocumentsProps(
            'PA-9',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).loadStepValues?.(abortSignal);
        },
        message: 'Failed to load PA supporting documents. Id: PA-9',
        logger: 'Failed to load PA supporting documents',
        id: 'PA-9',
      },
      {
        operation: () => {
          mocks.saveSupportingDocuments.mockRejectedValueOnce(
            new Error('save documents failed'),
          );
          return supportingDocumentsProps(
            'PA-10',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).onSaveAndNext?.({ form: {} }, true, abortSignal);
        },
        message: 'Failed to save PA supporting documents. Id: PA-10',
        logger: 'Failed to save PA supporting documents',
        id: 'PA-10',
      },
      {
        operation: () => {
          mocks.getSummary.mockRejectedValueOnce(
            new Error('load summary failed'),
          );
          return summaryAndSubmitProps(
            'PA-11',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).loadStepValues?.(abortSignal);
        },
        message: 'Failed to load PA summary. Id: PA-11',
        logger: 'Failed to load PA summary',
        id: 'PA-11',
      },
      {
        operation: () => {
          mocks.submit.mockRejectedValueOnce(new Error('submit failed'));
          return summaryAndSubmitProps(
            'PA-12',
            accounts,
            instance,
            accountDetails,
            stepStatuses,
            'Type approval',
          ).onSaveAndNext?.({}, true, abortSignal);
        },
        message: 'Failed to submit PA summary. Id: PA-12',
        logger: 'Failed to submit PA summary',
        id: 'PA-12',
      },
    ];

    for (const failureCase of failureCases) {
      await expect(Promise.resolve(failureCase.operation())).rejects.toThrow(
        failureCase.message,
      );
      expect(mocks.appLoggerError).toHaveBeenLastCalledWith(
        failureCase.logger,
        expect.any(Error),
        { Id: failureCase.id },
      );
    }
  });

  it('throws account-availability errors before making client calls', async () => {
    expect.hasAssertions();

    const appProps = applicationAndInstrumentProps(
      'PA-13',
      emptyAccounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const orgProps = organisationAndContactProps(
      'PA-13',
      emptyAccounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const docsProps = supportingDocumentsProps(
      'PA-13',
      emptyAccounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const summaryProps = summaryAndSubmitProps(
      'PA-13',
      emptyAccounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );

    const failureMessages = await Promise.all(
      [
        appProps.loadStepValues?.(),
        appProps.onSaveAndExit?.({}, false),
        orgProps.loadStepValues?.(),
        orgProps.onSaveAndExit?.({}, false),
        docsProps.loadStepValues?.(),
        docsProps.onSaveAndExit?.({ form: {} }, false),
        summaryProps.loadStepValues?.(),
        summaryProps.onSaveAndNext?.({}, false),
      ].map((operation) =>
        Promise.resolve(operation).then(
          () => undefined,
          (error: unknown) => (error as Error).message,
        ),
      ),
    );

    expect({
      failureMessages,
      verboseCalls: mocks.appLoggerVerbose.mock.calls.length,
    }).toStrictEqual({
      failureMessages: [
        'There are no accounts available to load PA application and instrument details. Id: PA-13',
        'There are no accounts available to save PA application and instrument details. Id: PA-13',
        'There are no accounts available to load PA organisation and contact details. Id: PA-13',
        'There are no accounts available to save PA organisation and contact details. Id: PA-13',
        'There are no accounts available to load PA supporting documents. Id: PA-13',
        'There are no accounts available to save PA supporting documents. Id: PA-13',
        'There are no accounts available to load PA summary. Id: PA-13',
        'There are no accounts available to submit PA summary. Id: PA-13',
      ],
      verboseCalls: 8,
    });
  });
});
