import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
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

vi.mock('../../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
        ...actual,
        RequestForPatternApprovalClient: vi.fn(function RequestForPatternApprovalClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getAppDetails: mocks.getAppDetails,
            };
        }),
    };
});

vi.mock('../../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
    },
}));

const accounts = [{ homeAccountId: 'account-1' }] as AccountInfo[];
const emptyAccounts = [] as AccountInfo[];
const instance = {
    acquireTokenSilent: mocks.acquireTokenSilent,
} as unknown as IPublicClientApplication;

describe('appDetailsProps', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.getAppDetails.mockResolvedValue({ applicationDetails: { referenceId: 'PA-1' } });
    });

    it('loads app details and exposes summary hiding rules', async () => {
        const props = appDetailsProps('PA-1', accounts, instance);
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues(abortSignal)).resolves.toEqual({
            formValues: { applicationDetails: { referenceId: 'PA-1' } },
        });
        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks.getAppDetails).toHaveBeenCalledWith('PA-1', abortSignal);
        expect(props.location).toBe('/summary');
        expect(props.title).toBe('Summary and submit');
        expect(props.isSummaryPage).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.branchOrLocationName?.({ organisationAndContact: {} })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.branchOrLocationName?.({ organisationAndContact: { branchOrLocationName: 'Branch' } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.isManufacturerHide?.({ organisationAndContact: { isManufacturer: YesNo.Yes } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.isManufacturerHide?.({ organisationAndContact: { isManufacturer: YesNo.No } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.isManufacturerHide?.({ organisationAndContact: { isManufacturer: undefined } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.({ organisationAndContact: { isPrincipalInvoiceContact: YesNo.Yes } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.({ organisationAndContact: { isPrincipalInvoiceContact: YesNo.No } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.principalInvoiceContactHide?.({ organisationAndContact: { isPrincipalInvoiceContact: undefined } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.isCurrentOrganisationHide?.({ organisationAndContact: { isManufacturer: YesNo.No } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.isCurrentOrganisationHide?.({ organisationAndContact: { isManufacturer: YesNo.Yes } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.contact?.titleOther?.({ organisationAndContact: { contact: { title: 'Other' } } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.contact?.titleOther?.({ organisationAndContact: { contact: { title: 'Dr' } } })).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.invoiceContact?.titleOther?.({ organisationAndContact: { invoiceContact: { title: 'Other' } } })).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.invoiceContact?.titleOther?.({ organisationAndContact: { invoiceContact: { title: 'Dr' } } })).toBe(true);
        expect(props.hidingFields?.applicationAndInstrument?.isApplNewHide?.({ applicationAndInstrument: { patternApprovalType: PatternApprovalRequiredValues.NewCertificate } })).toBe(false);
        expect(props.hidingFields?.applicationAndInstrument?.isApplNewHide?.({ applicationAndInstrument: { patternApprovalType: PatternApprovalRequiredValues.OtherApproval } })).toBe(true);
        expect(props.hidingFields?.applicationAndInstrument?.isApplVariationHide?.({ applicationAndInstrument: { patternApprovalType: PatternApprovalRequiredValues.Variation } })).toBe(false);
        expect(props.hidingFields?.applicationAndInstrument?.isApplVariationHide?.({ applicationAndInstrument: { patternApprovalType: undefined } })).toBe(true);
        expect(props.hidingFields?.applicationAndInstrument?.isApplOtherHide?.({ applicationAndInstrument: { patternApprovalType: PatternApprovalRequiredValues.OtherApproval } })).toBe(false);
        expect(props.hidingFields?.applicationAndInstrument?.isApplOtherHide?.({ applicationAndInstrument: { patternApprovalType: PatternApprovalRequiredValues.NewCertificate } })).toBe(true);
        expect(props.hidingFields?.applicationAndInstrument?.isApplOIMLHide?.({
            applicationAndInstrument: {
                newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
            },
        })).toBe(false);
    });

    it('logs and rethrows app details load failures', async () => {
        mocks.getAppDetails.mockRejectedValueOnce(new Error('load failed'));
        const props = appDetailsProps('PA-2', accounts, instance);

        await expect(props.loadStepValues()).rejects.toThrow('Failed to load app details. Id: PA-2');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load app details', expect.any(Error), { Id: 'PA-2' });
    });

    it('throws before loading when no account is available', async () => {
        const props = appDetailsProps('PA-3', emptyAccounts, instance);

        await expect(props.loadStepValues()).rejects.toThrow('There are no accounts available to load app details. Id: PA-3');
        expect(mocks.appLoggerVerbose).toHaveBeenCalledWith('There are no accounts available to load app details', {
            Id: 'PA-3',
            Accounts: emptyAccounts,
        });
        expect(mocks.getAppDetails).not.toHaveBeenCalled();
    });

    it('returns loaded values without mutating the client response', async () => {
        const appDetails: RequestForPatternApprovalAppDetails = {
            applicationDetails: { referenceId: 'PA-4' },
            organisationAndContact: { isManufacturer: YesNo.Yes },
        };
        mocks.getAppDetails.mockResolvedValueOnce(appDetails);

        await expect(appDetailsProps('PA-4', accounts, instance).loadStepValues()).resolves.toEqual({
            formValues: {
                applicationDetails: { referenceId: 'PA-4' },
                organisationAndContact: { isManufacturer: YesNo.Yes },
            },
        });
        expect(appDetails).toEqual({
            applicationDetails: { referenceId: 'PA-4' },
            organisationAndContact: { isManufacturer: YesNo.Yes },
        });
    });
});
