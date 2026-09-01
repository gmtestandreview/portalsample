import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';
import type { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';
import applicationAndInstrumentProps from '../../../../ClientApp/src/routes/ta/applicationAndInstrumentProps';
import organisationAndContactProps from '../../../../ClientApp/src/routes/ta/organisationAndContactProps';
import supportingDocumentsProps from '../../../../ClientApp/src/routes/ta/supportingDocumentsProps';
import summaryAndSubmitProps from '../../../../ClientApp/src/routes/ta/summaryAndSubmitProps';
import type {
    ApplicationAndInstrumentStepDto,
    PatternApprovalOrgAndContact,
    RequestForPatternApprovalSummaryDto,
} from '../../../../ClientApp/src/routes/ta/types';
import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';
import {
    CRMLookupTypes,
    PatternApprovalRequiredValueOptions,
    PatternApprovalRequiredValues,
    type RequestForPatternApprovalSummary,
    type SupportingDocumentsStep,
    YesNo,
} from '../../../../ClientApp/src/api/web-api-client';
import { formikHelpers, stepStatuses } from '../testFixtures';

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

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
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
        RequestForPatternApprovalClient: vi.fn(function RequestForPatternApprovalClientMock() {
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
        }),
    };
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
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
const accountDetails = {
    organisation: 'National Measurement Institute',
    trading: 'Trading',
    branch: 'Branch',
} as AccountDetails;

describe('pattern approval wizard prop factories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.getLookup.mockImplementation((type: CRMLookupTypes) => Promise.resolve([{ id: type, name: type }]));
        mocks.getAllInfoPanelContent.mockResolvedValue([{ instrumentTypeId: 'type-1' }]);
        mocks.getNmiApplication.mockResolvedValue([{ id: 'cert-1', name: 'NMI-1' }]);
        mocks.getApplicationAndInstrument.mockResolvedValue({ patternApprovalType: PatternApprovalRequiredValues.NewCertificate });
        mocks.getOrganisationAndContact.mockResolvedValue({ isManufacturer: YesNo.No });
        mocks.getSupportingDocuments.mockResolvedValue({ form: { documents: [] } });
        mocks.getSummary.mockResolvedValue({
            referenceId: 'PA-1',
            applicationAndInstrument: {
                patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
            },
        });
    });

    it('loads and saves application/instrument details while stripping lookup-only values', async () => {
        const props = applicationAndInstrumentProps('PA-1', accounts, instance, accountDetails, stepStatuses, 'Type approval');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: {
                patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
                instrumentCategoryLookup: [{ id: CRMLookupTypes.PAPortalCategory, name: CRMLookupTypes.PAPortalCategory }],
                instrumentTypeLookup: [{ id: CRMLookupTypes.PAPortalInstrumentType, name: CRMLookupTypes.PAPortalInstrumentType }],
                instrumentTypeContent: [{ instrumentTypeId: 'type-1' }],
                certNameOptions: [{ id: 'cert-1', name: 'NMI-1' }],
            },
        });
        expect(mocks.getApplicationAndInstrument).toHaveBeenCalledWith('PA-1', abortSignal);
        expect(props.bannerRefTitle).toBe('Ref ID: PA-1');
        expect(props.bannerSubTitle).toBe('Trading - Branch - National Measurement Institute');
        expect(props.hidingFields?.isApplNewHide?.({ patternApprovalType: PatternApprovalRequiredValues.NewCertificate })).toBe(false);
        expect(props.hidingFields?.isApplNewInstrumentHide?.({ patternApprovalType: PatternApprovalRequiredValues.Variation })).toBe(true);
        expect(props.hidingFields?.isApplVariationHide?.({ patternApprovalType: PatternApprovalRequiredValues.Variation })).toBe(false);
        expect(props.hidingFields?.isApplOtherHide?.({ patternApprovalType: PatternApprovalRequiredValues.OtherApproval })).toBe(false);
        expect(props.hidingFields?.isApplOIMLHide?.({
            newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
            instrumentCategory: 'category-1',
            instrumentType: 'type-1',
            instrumentTypeContent: [{
                instrumentCategoryId: 'category-1',
                instrumentTypeId: 'type-1',
                eligibleForOiml: false,
            }],
        })).toBe(false);

        await props.onSaveAndNext?.({
            patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
            instrumentCategoryLookup: [{ id: 'category-1', name: 'Category 1' }],
            instrumentTypeLookup: [{ id: 'type-1', name: 'Type 1' }],
            instrumentTypeContent: [{ instrumentTypeId: 'type-1' }],
            certNameOptions: [{ id: 'cert-1', name: 'Certificate 1' }],
        }, true, formikHelpers<ApplicationAndInstrumentStepDto>(), abortSignal);
        expect(mocks.saveApplicationAndInstrument).toHaveBeenCalledWith('PA-1', {
            applicationId: 'PA-1',
            formStep: {
                patternApprovalType: PatternApprovalRequiredValues.NewCertificate,
                instrumentCategoryLookup: undefined,
                instrumentTypeLookup: undefined,
                instrumentTypeContent: undefined,
                certNameOptions: undefined,
            },
            isCompletingStep: true,
        }, abortSignal);

        await props.onSaveAndExit?.({ patternApprovalType: PatternApprovalRequiredValues.Variation }, false, formikHelpers<ApplicationAndInstrumentStepDto>(), abortSignal);
        expect(mocks.saveApplicationAndInstrument).toHaveBeenLastCalledWith('PA-1', {
            applicationId: 'PA-1',
            formStep: {
                patternApprovalType: PatternApprovalRequiredValues.Variation,
                instrumentCategoryLookup: undefined,
                instrumentTypeLookup: undefined,
                instrumentTypeContent: undefined,
                certNameOptions: undefined,
            },
            isCompletingStep: false,
        }, abortSignal);
    });

    it('loads and saves organisation/contact details with all hide branches', async () => {
        const props = organisationAndContactProps('PA-2', accounts, instance, accountDetails, stepStatuses, 'Type approval');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { isManufacturer: YesNo.No },
        });
        expect(mocks.getOrganisationAndContact).toHaveBeenCalledWith('PA-2', abortSignal);
        expect(props.hidingFields?.isManufacturerHide?.({ isManufacturer: YesNo.Yes })).toBe(true);
        expect(props.hidingFields?.isManufacturerHide?.({ isManufacturer: YesNo.No })).toBe(false);
        expect(props.hidingFields?.isManufacturerHide?.({ isManufacturer: undefined })).toBe(true);
        expect(props.hidingFields?.isCurrentOrganisationHide?.({})).toBe(true);
        expect(props.hidingFields?.principalContactHide?.({ isPrincipalContact: YesNo.Yes })).toBe(true);
        expect(props.hidingFields?.principalContactHide?.({ isPrincipalContact: YesNo.No })).toBe(false);
        expect(props.hidingFields?.principalContactHide?.({ isPrincipalContact: undefined })).toBe(true);
        expect(props.hidingFields?.principalInvoiceContactHide?.({ isPrincipalInvoiceContact: YesNo.Yes })).toBe(true);
        expect(props.hidingFields?.principalInvoiceContactHide?.({ isPrincipalInvoiceContact: YesNo.No })).toBe(false);
        expect(props.hidingFields?.principalInvoiceContactHide?.({ isPrincipalInvoiceContact: undefined })).toBe(true);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: 'Other' } })).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: 'Dr' } })).toBe(true);
        expect(props.hidingFields?.invoiceContact?.titleOther?.({ invoiceContact: { title: 'Other' } })).toBe(false);
        expect(props.hidingFields?.invoiceContact?.titleOther?.({ invoiceContact: { title: 'Dr' } })).toBe(true);
        expect(props.getRedirectionLocationOnError?.(404, {} as ErrorType)).toBe('/not-found');

        await props.onSaveAndExit?.({ isManufacturer: YesNo.No }, false, formikHelpers<PatternApprovalOrgAndContact>(), abortSignal);
        expect(mocks.saveOrganisationAndContact).toHaveBeenCalledWith('PA-2', {
            applicationId: 'PA-2',
            formStep: { isManufacturer: YesNo.No },
            isCompletingStep: false,
        }, abortSignal);
        await props.onSaveAndNext?.({ isManufacturer: YesNo.Yes }, true, formikHelpers<PatternApprovalOrgAndContact>(), abortSignal);
        expect(mocks.saveOrganisationAndContact).toHaveBeenLastCalledWith('PA-2', {
            applicationId: 'PA-2',
            formStep: { isManufacturer: YesNo.Yes },
            isCompletingStep: true,
        }, abortSignal);
    });

    it('loads and saves supporting documents with document-list branches', async () => {
        const props = supportingDocumentsProps('PA-3', accounts, instance, accountDetails, stepStatuses, 'Type approval');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { form: { documents: [] } },
        });
        expect(mocks.getSupportingDocuments).toHaveBeenCalledWith('PA-3', abortSignal);
        expect(props.discard).toEqual({
            locationOnDiscard: '/',
            showCancelButton: false,
        });
        expect(props.getRedirectionLocationOnError?.(404, {} as ErrorType)).toBe('/not-found');
        expect(props.isSummaryPage).toBe(true);
        expect(props.suppressErrorSummary).toBe(true);
        expect(props.suppressErrorSummaryPath).toBe(true);

        const documents: SupportingDocumentsStep = {
            form: { documents: [{ fileName: 'manual.pdf', attachmentCategory: 'Manual' }] },
        };
        await props.onSaveAndNext?.(documents, true, formikHelpers<SupportingDocumentsStep>(), abortSignal);
        expect(mocks.saveSupportingDocuments).toHaveBeenCalledWith('PA-3', {
            applicationId: 'PA-3',
            formStep: documents,
            isCompletingStep: true,
        }, abortSignal);

        const withoutDocuments: SupportingDocumentsStep = { form: {} };
        await props.onSaveAndExit?.(withoutDocuments, false, formikHelpers<SupportingDocumentsStep>(), abortSignal);
        expect(mocks.saveSupportingDocuments).toHaveBeenLastCalledWith('PA-3', {
            applicationId: 'PA-3',
            formStep: withoutDocuments,
            isCompletingStep: false,
        }, abortSignal);
    });

    it('loads and submits summary values with lookup-enriched application details', async () => {
        const props = summaryAndSubmitProps('PA-4', accounts, instance, accountDetails, stepStatuses, 'Type approval');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: {
                referenceId: 'PA-1',
                applicationAndInstrument: {
                    patternApprovalType: PatternApprovalRequiredValues.OtherApproval,
                    instrumentCategoryLookup: [{ id: CRMLookupTypes.PAPortalCategory, name: CRMLookupTypes.PAPortalCategory }],
                    instrumentTypeLookup: [{ id: CRMLookupTypes.PAPortalInstrumentType, name: CRMLookupTypes.PAPortalInstrumentType }],
                },
            },
        });
        expect(mocks.getSummary).toHaveBeenCalledWith('PA-4', abortSignal);
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
            newSubOptions: [PatternApprovalRequiredValueOptions.OIMLCertificate],
        })).toBe(false);
        expect(props.getRedirectionLocationOnError?.(404, {} as ErrorType)).toBe('/not-found');
        expect(props.disableLinkedError).toBe(false);
        expect(props.suppressErrorSummaryPath).toBe(true);

        const summary: RequestForPatternApprovalSummaryDto = {
            referenceId: 'PA-4',
            acceptNMIP106: true,
            acceptTermsAndConditions: true,
            acceptDeclaration: true,
        };
        await props.onSaveAndNext?.(summary, true, formikHelpers<RequestForPatternApprovalSummaryDto>(), abortSignal);
        expect(mocks.submit).toHaveBeenCalledWith('PA-4', {
            applicationId: 'PA-4',
            formStep: summary as RequestForPatternApprovalSummary,
            isCompletingStep: true,
        }, abortSignal);
    });

    it('logs and rethrows client failures from each async prop helper', async () => {
        const abortSignal = new AbortController().signal;
        mocks.getApplicationAndInstrument.mockRejectedValueOnce(new Error('load application failed'));
        await expect(applicationAndInstrumentProps('PA-5', accounts, instance, accountDetails, stepStatuses, 'Type approval').loadStepValues?.(abortSignal))
            .rejects.toThrow('Failed to load PA application and instrument details. Id: PA-5');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load PA application and instrument details', expect.any(Error), { Id: 'PA-5' });

        mocks.saveApplicationAndInstrument.mockRejectedValueOnce(new Error('save application failed'));
        await expect(applicationAndInstrumentProps('PA-6', accounts, instance, accountDetails, stepStatuses, 'Type approval').onSaveAndNext?.(
            {},
            true,
            formikHelpers<ApplicationAndInstrumentStepDto>(),
            abortSignal,
        )).rejects.toThrow('Failed to save PA application and instrument details. Id: PA-6');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to save PA application and instrument details', expect.any(Error), { Id: 'PA-6' });

        mocks.getOrganisationAndContact.mockRejectedValueOnce(new Error('load organisation failed'));
        await expect(organisationAndContactProps('PA-7', accounts, instance, accountDetails, stepStatuses, 'Type approval').loadStepValues?.(abortSignal))
            .rejects.toThrow('Failed to load PA org and contact details. Id: PA-7');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load PA org and contact details', expect.any(Error), { Id: 'PA-7' });

        mocks.saveOrganisationAndContact.mockRejectedValueOnce(new Error('save organisation failed'));
        await expect(organisationAndContactProps('PA-8', accounts, instance, accountDetails, stepStatuses, 'Type approval').onSaveAndNext?.(
            {},
            true,
            formikHelpers<PatternApprovalOrgAndContact>(),
            abortSignal,
        )).rejects.toThrow('Failed to save PA org and contact details. Id: PA-8');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to save PA org and contact details', expect.any(Error), { Id: 'PA-8' });

        mocks.getSupportingDocuments.mockRejectedValueOnce(new Error('load documents failed'));
        await expect(supportingDocumentsProps('PA-9', accounts, instance, accountDetails, stepStatuses, 'Type approval').loadStepValues?.(abortSignal))
            .rejects.toThrow('Failed to load PA supporting documents. Id: PA-9');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load PA supporting documents', expect.any(Error), { Id: 'PA-9' });

        mocks.saveSupportingDocuments.mockRejectedValueOnce(new Error('save documents failed'));
        await expect(supportingDocumentsProps('PA-10', accounts, instance, accountDetails, stepStatuses, 'Type approval').onSaveAndNext?.(
            { form: {} },
            true,
            formikHelpers<SupportingDocumentsStep>(),
            abortSignal,
        )).rejects.toThrow('Failed to save PA supporting documents. Id: PA-10');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to save PA supporting documents', expect.any(Error), { Id: 'PA-10' });

        mocks.getSummary.mockRejectedValueOnce(new Error('load summary failed'));
        await expect(summaryAndSubmitProps('PA-11', accounts, instance, accountDetails, stepStatuses, 'Type approval').loadStepValues?.(abortSignal))
            .rejects.toThrow('Failed to load PA summary. Id: PA-11');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load PA summary', expect.any(Error), { Id: 'PA-11' });

        mocks.submit.mockRejectedValueOnce(new Error('submit failed'));
        await expect(summaryAndSubmitProps('PA-12', accounts, instance, accountDetails, stepStatuses, 'Type approval').onSaveAndNext?.(
            {},
            true,
            formikHelpers<RequestForPatternApprovalSummaryDto>(),
            abortSignal,
        )).rejects.toThrow('Failed to submit PA summary. Id: PA-12');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to submit PA summary', expect.any(Error), { Id: 'PA-12' });
    });

    it('throws account-availability errors before making client calls', async () => {
        const appProps = applicationAndInstrumentProps('PA-13', emptyAccounts, instance, accountDetails, stepStatuses, 'Type approval');
        const orgProps = organisationAndContactProps('PA-13', emptyAccounts, instance, accountDetails, stepStatuses, 'Type approval');
        const docsProps = supportingDocumentsProps('PA-13', emptyAccounts, instance, accountDetails, stepStatuses, 'Type approval');
        const summaryProps = summaryAndSubmitProps('PA-13', emptyAccounts, instance, accountDetails, stepStatuses, 'Type approval');

        await expect(appProps.loadStepValues?.()).rejects.toThrow('There are no accounts available to load PA application and instrument details. Id: PA-13');
        await expect(appProps.onSaveAndExit?.({}, false, formikHelpers<ApplicationAndInstrumentStepDto>())).rejects.toThrow('There are no accounts available to save PA application and instrument details. Id: PA-13');
        await expect(orgProps.loadStepValues?.()).rejects.toThrow('There are no accounts available to load PA organisation and contact details. Id: PA-13');
        await expect(orgProps.onSaveAndExit?.({}, false, formikHelpers<PatternApprovalOrgAndContact>())).rejects.toThrow('There are no accounts available to save PA organisation and contact details. Id: PA-13');
        await expect(docsProps.loadStepValues?.()).rejects.toThrow('There are no accounts available to load PA supporting documents. Id: PA-13');
        await expect(docsProps.onSaveAndExit?.({ form: {} }, false, formikHelpers<SupportingDocumentsStep>())).rejects.toThrow('There are no accounts available to save PA supporting documents. Id: PA-13');
        await expect(summaryProps.loadStepValues?.()).rejects.toThrow('There are no accounts available to load PA summary. Id: PA-13');
        await expect(summaryProps.onSaveAndNext?.({}, false, formikHelpers<RequestForPatternApprovalSummaryDto>())).rejects.toThrow('There are no accounts available to submit PA summary. Id: PA-13');
        expect(mocks.appLoggerVerbose).toHaveBeenCalledTimes(8);
    });
});
