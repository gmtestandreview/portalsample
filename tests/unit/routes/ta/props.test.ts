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
  setAuthToken: vi.fn(),
  getLookup: vi.fn(),
  getAllInfoPanelContent: vi.fn(),
  getNmiApplication: vi.fn(),
  getApplicationAndInstrument: vi.fn(),
  saveApplicationAndInstrument: vi.fn(),
  getOrganisationAndContact: vi.fn(),
  saveOrganisationAndContact: vi.fn(),
  getSupportingDocuments: vi.fn(),
  saveSupportingDocuments: vi.fn(),
  getSummary: vi.fn(),
  submit: vi.fn(),
  acquireTokenSilent: vi.fn(),
  appLoggerError: vi.fn(),
  appLoggerVerbose: vi.fn(),
}));

vi.mock(
  import('../../../../ClientApp/src/api/web-api-client'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
      ...actual,
      LookupClient: vi.fn(function LookupClientMock() {
        return {
          setAuthToken: mocks.setAuthToken,
          getLookup: mocks.getLookup,
          getAllInfoPanelContent: mocks.getAllInfoPanelContent,
          getNmiApplication: mocks.getNmiApplication,
        };
      }),
      RequestForPatternApprovalClient: vi.fn(
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
  import('../../../../ClientApp/src/instrumentation/AppLogger'),
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
    expect.assertions(1);
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
  });
});

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
    expect.assertions(1);
    const props = applicationAndInstrumentProps(
      'PA-1',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;
    expect(mocks.getApplicationAndInstrument).toHaveBeenCalledWith(
      'PA-1',
      abortSignal,
    );
  });
});

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
    expect.assertions(1);
    const props = applicationAndInstrumentProps(
      'PA-1',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;
    expect(props.bannerRefTitle).toBe('Ref ID: PA-1');
  });
});

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
    expect.assertions(1);
    const props = applicationAndInstrumentProps(
      'PA-1',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;
    expect(props.bannerSubTitle).toBe(
      'Trading - Branch - National Measurement Institute',
    );
  });
});

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
    expect.assertions(1);
    const props = applicationAndInstrumentProps(
      'PA-1',
      accounts,
      instance,
      accountDetails,
      stepStatuses,
      'Type approval',
    );
    const abortSignal = new AbortController().signal;
    expect(
      props.hidingFields?.isApplNewHide?.({
        patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
      }),
    ).toBe(false);
  });
});
