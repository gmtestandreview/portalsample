import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import instrumentAndRequestProps from '../../../../ClientApp/src/routes/requestForQuote/instrumentAndRequestProps';
import organisationAndContactProps from '../../../../ClientApp/src/routes/requestForQuote/organisationAndContactProps';
import requestForQuoteSummaryProps from '../../../../ClientApp/src/routes/requestForQuote/requestForQuoteSummaryProps';
import viewRequestForQuoteSummaryProps from '../../../../ClientApp/src/routes/requestForQuote/viewRequestForQuoteSummaryProps';
import { ErrorType } from '../../../../ClientApp/src/components/forms/WizardForm/types';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';
import {
    YesNo,
    type InstrumentAndRequestStep,
    type OrganisationAndContact,
    type RequestForQuoteSummary,
} from '../../../../ClientApp/src/api/web-api-client';
import { formikHelpers, stepStatuses } from '../testFixtures';

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

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
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
    };
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
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
const statuses = stepStatuses;

describe('request for quote wizard prop factories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.getInstrumentAndRequest.mockResolvedValue({ instrument: 'Balance' });
        mocks.getOrganisationAndContact.mockResolvedValue({ isPrincipalContact: YesNo.No });
        mocks.getSummary.mockResolvedValue({ referenceId: 'RFQ-1' });
        mocks.getSubmittedSummary.mockResolvedValue({ referenceId: 'RFQ-2' });
    });

    it('loads and saves instrument/request values with date normalization and hiding rules', async () => {
        const props = instrumentAndRequestProps('APP-1', accounts, instance, accountDetails, statuses, 'Request quote');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { instrument: 'Balance' },
        });
        expect(mocks.setAuthToken).toHaveBeenCalledWith('access-token');
        expect(mocks.getInstrumentAndRequest).toHaveBeenCalledWith('APP-1', abortSignal);
        expect(props.hidingFields?.serialNumber?.({ hasSerialNumber: YesNo.No })).toBe(true);
        expect(props.hidingFields?.serialNumber?.({ hasSerialNumber: YesNo.Yes })).toBe(false);
        expect(props.bannerRefTitle).toBe('Ref ID: APP-1');
        expect(props.bannerSubTitle).toBe('Trading - Branch - National Measurement Institute');

        await props.onSaveAndNext?.({
            hasSerialNumber: YesNo.Yes,
            preferredInstrumentOrArtefactAvailabilityDate: new Date('2026-06-12T00:00:00Z'),
        }, true, formikHelpers<InstrumentAndRequestStep>(), abortSignal);

        expect(mocks.saveInstrumentAndRequest).toHaveBeenCalledWith('APP-1', {
            applicationId: 'APP-1',
            formStep: expect.objectContaining({
                preferredInstrumentOrArtefactAvailabilityDate: expect.any(Date),
            }),
            isCompletingStep: true,
        }, abortSignal);

        await props.onSaveAndExit?.(
            { hasSerialNumber: YesNo.No },
            false,
            formikHelpers<InstrumentAndRequestStep>(),
            abortSignal,
        );
        expect(mocks.saveInstrumentAndRequest).toHaveBeenLastCalledWith('APP-1', {
            applicationId: 'APP-1',
            formStep: { hasSerialNumber: YesNo.No },
            isCompletingStep: false,
        }, abortSignal);
    });

    it('loads and saves organisation/contact values and reports not-found redirects', async () => {
        const props = organisationAndContactProps('APP-2', accounts, instance, accountDetails, statuses, 'Request quote');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { isPrincipalContact: YesNo.No },
        });
        expect(mocks.getOrganisationAndContact).toHaveBeenCalledWith('APP-2', abortSignal);
        expect(props.hidingFields?.businessOrTradingName?.({})).toBe(false);
        expect(props.hidingFields?.branchOrLocationName?.({})).toBe(false);
        expect(props.hidingFields?.principalContactHide?.({ isPrincipalContact: YesNo.Yes })).toBe(true);
        expect(props.hidingFields?.principalContactHide?.({ isPrincipalContact: YesNo.No })).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: 'Other' } })).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: 'Dr' } })).toBe(true);
        expect(props.getRedirectionLocationOnError?.(500, ErrorType.Load)).toBe('/not-found');

        await props.onSaveAndExit?.(
            { isPrincipalContact: YesNo.No },
            true,
            formikHelpers<OrganisationAndContact>(),
            abortSignal,
        );

        expect(mocks.saveOrganisationAndContact).toHaveBeenCalledWith('APP-2', {
            applicationId: 'APP-2',
            formStep: { isPrincipalContact: YesNo.No },
            isCompletingStep: false,
        }, abortSignal);
    });

    it('loads, submits, and logs request-for-quote summary failures', async () => {
        const props = requestForQuoteSummaryProps('APP-3', accounts, instance, accountDetails, statuses, 'Request quote');
        const abortSignal = new AbortController().signal;
        const summary = {
            organisationAndContact: {
                contact: { title: 'Dr' },
            },
        } as RequestForQuoteSummary;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { referenceId: 'RFQ-1' },
        });
        expect(mocks.getSummary).toHaveBeenCalledWith('APP-3', abortSignal);
        expect(props.hidingFields?.organisationAndContact?.branchOrLocationName?.(summary)).toBe(true);
        expect(props.hidingFields?.organisationAndContact?.principalContactHide?.(summary)).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.contact?.titleOther?.(summary)).toBe(true);
        expect(props.getRedirectionLocationOnError?.(404, ErrorType.Load)).toBe('/not-found');

        await props.onSaveAndNext?.(summary, true, formikHelpers<RequestForQuoteSummary>(), abortSignal);
        expect(mocks.submit).toHaveBeenCalledWith('APP-3', {
            applicationId: 'APP-3',
            formStep: summary,
            isCompletingStep: true,
        }, abortSignal);

        mocks.submit.mockRejectedValueOnce(new Error('submit failed'));
        await expect(props.onSaveAndNext?.(
            summary,
            true,
            formikHelpers<RequestForQuoteSummary>(),
            abortSignal,
        )).resolves.toBeUndefined();
        expect(mocks.appLoggerError).toHaveBeenCalledWith('failoed to submit form', expect.any(Error), { Id: 'APP-3' });

        mocks.getSummary.mockRejectedValueOnce(new Error('load failed'));
        await expect(props.loadStepValues?.(abortSignal)).rejects.toThrow('There was an error retrieving your details.');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load summary', expect.any(Error), { Id: 'APP-3' });
    });

    it('loads and submits the submitted summary view', async () => {
        const props = viewRequestForQuoteSummaryProps('APP-4', accounts, instance, accountDetails, statuses, 'Request quote');
        const abortSignal = new AbortController().signal;
        const summary = {
            organisationAndContact: {
                branchOrLocationName: 'Branch',
                contact: { title: 'Other' },
            },
        } as RequestForQuoteSummary;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { referenceId: 'RFQ-2' },
        });
        expect(mocks.getSubmittedSummary).toHaveBeenCalledWith('APP-4', abortSignal);
        expect(props.hidingFields?.organisationAndContact?.branchOrLocationName?.(summary)).toBe(false);
        expect(props.hidingFields?.organisationAndContact?.contact?.titleOther?.(summary)).toBe(false);
        expect(props.getRedirectionLocationOnError?.(404, ErrorType.Load)).toBe('/not-found');

        await props.onSaveAndNext?.(summary, false, formikHelpers<RequestForQuoteSummary>(), abortSignal);
        expect(mocks.submit).toHaveBeenCalledWith('APP-4', {
            applicationId: 'APP-4',
            formStep: summary,
            isCompletingStep: true,
        }, abortSignal);
    });

    it('throws load/save errors when no account is available', async () => {
        const instrumentProps = instrumentAndRequestProps('APP-5', emptyAccounts, instance, accountDetails, statuses, 'Request quote');
        const organisationProps = organisationAndContactProps('APP-5', emptyAccounts, instance, accountDetails, statuses, 'Request quote');
        const summaryProps = requestForQuoteSummaryProps('APP-5', emptyAccounts, instance, accountDetails, statuses, 'Request quote');
        const viewSummaryProps = viewRequestForQuoteSummaryProps('APP-5', emptyAccounts, instance, accountDetails, statuses, 'Request quote');

        await expect(instrumentProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(instrumentProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<InstrumentAndRequestStep>(),
        )).rejects.toThrow('error');
        await expect(organisationProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(organisationProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<OrganisationAndContact>(),
        )).rejects.toThrow('error');
        await expect(summaryProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(summaryProps.onSaveAndNext?.(
            {},
            false,
            formikHelpers<RequestForQuoteSummary>(),
        )).rejects.toThrow('error');
        await expect(viewSummaryProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(viewSummaryProps.onSaveAndNext?.(
            {},
            false,
            formikHelpers<RequestForQuoteSummary>(),
        )).rejects.toThrow('error');
    });
});
