import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
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
    type DeliveryAndReturnStep,
    type PaymentDetailsStep,
    type ReportRecipientStep,
    type SummaryAndAcceptStep,
} from '../../../../ClientApp/src/api/web-api-client';
import { formikHelpers, stepStatuses } from '../testFixtures';

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

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
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
    };
});

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../../ClientApp/src/storage/notification', () => ({
    setDashboardNotification: mocks.setDashboardNotification,
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
    },
}));

vi.mock('../../../../ClientApp/src/storage/sessionStorageCache', () => ({
    default: () => ({
        setItem: mocks.sessionSetItem,
    }),
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

describe('accept quote wizard prop factories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.getDeliveryAndReturn.mockResolvedValue({ returnContactType: 'SamePerson' });
        mocks.getPaymentDetails.mockResolvedValue({ invoiceSentTo: 'SamePerson' });
        mocks.getReportRecipient.mockResolvedValue({ reportAddressType: 'Other' });
        mocks.getSummaryAndAccept.mockResolvedValue({ associatedDisputes: 'No' });
    });

    it('loads, saves, hides, and redirects delivery/return branches', async () => {
        const props = deliveryAndReturnProps('Q-1', accounts, instance, accountDetails, statuses, 'Accept quote');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { returnContactType: 'SamePerson' },
        });
        expect(mocks.getDeliveryAndReturn).toHaveBeenCalledWith('Q-1', abortSignal);
        expect(props.hidingFields?.contactHide?.({ returnContactType: ReturnContactTypeValues.SamePerson })).toBe(true);
        expect(props.hidingFields?.contactHide?.({ returnContactType: ReturnContactTypeValues.DifferentPerson })).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: Title.Other } })).toBe(false);
        expect(props.hidingFields?.returnAddress?.({ returnAddressType: ReturnAddressTypeValues.Other })).toBe(false);
        expect(props.hidingFields?.carrierHide?.({ returnMethod: ReturnMethodValues.ClientWillProvide })).toBe(false);
        expect(props.bannerRefTitle).toBe('Quotation ID: Q-1');

        await props.onSaveAndNext?.(
            { returnContactType: ReturnContactTypeValues.SamePerson },
            true,
            formikHelpers<DeliveryAndReturnStep>(),
            abortSignal,
        );
        expect(mocks.saveDeliveryAndReturn).toHaveBeenCalledWith('Q-1', {
            applicationId: 'Q-1',
            formStep: { returnContactType: 'SamePerson' },
            isCompletingStep: true,
        }, abortSignal);

        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/accept-quote/Q-1/view-summary');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.NotFound, ErrorType.Update)).toBe('/');
        expect(setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Another person has deleted this request'),
        }));
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Update)).toBeUndefined();
    });

    it('loads and saves payment details while logging load and save failures', async () => {
        const props = paymentDetailsProps('Q-2', accounts, instance, accountDetails, statuses, 'Accept quote');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { invoiceSentTo: 'SamePerson' },
        });
        expect(props.hidingFields?.contactHide?.({ invoiceSentTo: InvoiceSentToValues.SamePerson })).toBe(true);
        expect(props.hidingFields?.contactHide?.({ invoiceSentTo: InvoiceSentToValues.DifferentPerson })).toBe(false);
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: Title.Dr } })).toBe(true);
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/accept-quote/Q-2/view-summary');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.NotFound, ErrorType.Update)).toBe('/');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Update)).toBeUndefined();

        const paymentValues: PaymentDetailsStep = { invoiceSentTo: InvoiceSentToValues.DifferentPerson };
        await props.onSaveAndExit?.(
            paymentValues,
            false,
            formikHelpers<PaymentDetailsStep>(),
            abortSignal,
        );
        expect(mocks.savePaymentDetails).toHaveBeenCalledWith('Q-2', {
            applicationId: 'Q-2',
            formStep: { invoiceSentTo: InvoiceSentToValues.DifferentPerson },
            isCompletingStep: false,
        }, abortSignal);

        mocks.savePaymentDetails.mockRejectedValueOnce(new Error('save failed'));
        await expect(props.onSaveAndNext?.(
            paymentValues,
            true,
            formikHelpers<PaymentDetailsStep>(),
            abortSignal,
        )).resolves.toBeUndefined();
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to save payment details:', expect.any(Error), { ApplicationId: 'Q-2' });

        mocks.getPaymentDetails.mockRejectedValueOnce(new Error('load failed'));
        await expect(props.loadStepValues?.(abortSignal)).rejects.toThrow('There was an error retrieving your details.');
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to load payment details', expect.any(Error), { Id: 'Q-2' });
    });

    it('loads and saves report recipient details with custom discard and error logging', async () => {
        const props = reportRecipientProps('Q-3', 'RFQ-3', accounts, instance, accountDetails, statuses, 'Accept quote');
        const abortSignal = new AbortController().signal;

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { reportAddressType: 'Other' },
        });
        expect(props.hidingFields?.contact?.titleOther?.({ contact: { title: Title.Other } })).toBe(false);
        expect(props.hidingFields?.businessStreetAddress?.({ reportAddressType: ReportAddressTypeValues.Other })).toBe(false);
        expect(props.hidingFields?.businessStreetAddress?.({ reportAddressType: ReportAddressTypeValues.BusinessAddress })).toBe(true);
        expect(props.discard?.locationOnCancel).toBe('/quotation/RFQ-3');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/accept-quote/Q-3/view-summary');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.NotFound, ErrorType.Update)).toBe('/');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Update)).toBeUndefined();

        const recipientValues: ReportRecipientStep = { reportAddressType: ReportAddressTypeValues.Other };
        await props.onSaveAndNext?.(
            recipientValues,
            true,
            formikHelpers<ReportRecipientStep>(),
            abortSignal,
        );
        expect(mocks.saveReportRecipient).toHaveBeenCalledWith('Q-3', {
            applicationId: 'Q-3',
            formStep: { reportAddressType: 'Other' },
            isCompletingStep: true,
        }, abortSignal);

        mocks.saveReportRecipient.mockRejectedValueOnce(new Error('save failed'));
        await expect(props.onSaveAndExit?.(
            recipientValues,
            false,
            formikHelpers<ReportRecipientStep>(),
            abortSignal,
        )).resolves.toBeUndefined();
        expect(mocks.appLoggerError).toHaveBeenCalledWith('Failed to save payment report recipient', expect.any(Error), { Id: 'Q-3' });
    });

    it('loads, saves, completes, and hides summary/accept sections', async () => {
        const props = summaryAndAcceptProps('Q-4', accounts, instance, accountDetails, statuses, 'Accept quote');
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

        await expect(props.loadStepValues?.(abortSignal)).resolves.toEqual({
            stepValues: { associatedDisputes: 'No' },
        });
        expect(props.hidingFields?.associatedDispute?.(summary)).toBe(true);
        expect(props.hidingFields?.reportRecipient?.rfqHide?.(summary)).toBe(false);
        expect(props.hidingFields?.reportRecipient?.organisationNameHide?.(summary)).toBe(true);
        expect(props.hidingFields?.reportRecipient?.contact?.titleOther?.(summary)).toBe(false);
        expect(props.hidingFields?.reportRecipient?.recipientMailingAddress?.(summary)).toBe(true);
        expect(props.hidingFields?.deliveryAndReturn?.rfqHide?.(summary)).toBe(false);
        expect(props.hidingFields?.deliveryAndReturn?.contactHide?.(summary)).toBe(true);
        expect(props.hidingFields?.deliveryAndReturn?.contact?.titleOther?.(summary)).toBe(true);
        expect(props.hidingFields?.paymentDetails?.rfqHide?.(summary)).toBe(true);
        expect(props.hidingFields?.paymentDetails?.contactHide?.(summary)).toBe(false);
        expect(props.hidingFields?.paymentDetails?.contact?.titleOther?.(summary)).toBe(false);
        expect(props.hidingFields?.requestForQuote?.contact?.titleOther?.(summary)).toBe(true);

        await props.onSaveAndExit?.(summary, false, formikHelpers<SummaryAndAcceptStep>(), abortSignal);
        expect(mocks.sessionSetItem).not.toHaveBeenCalled();

        await props.onSaveAndNext?.(summary, true, formikHelpers<SummaryAndAcceptStep>(), abortSignal);
        expect(mocks.saveSummaryAndAccept).toHaveBeenLastCalledWith('Q-4', {
            applicationId: 'Q-4',
            formStep: summary,
            isCompletingStep: true,
        }, abortSignal);
        expect(mocks.sessionSetItem).toHaveBeenCalledWith('RFQ-NUM-4', 'accepted-quote-id');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.PreconditionFailed, ErrorType.Load)).toBe('/request-for-quote/Q-4/view-summary');
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.NotFound, ErrorType.Update)).toBe('/');
        expect(setDashboardNotification).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('already been deleted'),
        }));
        expect(props.getRedirectionLocationOnError?.(HttpStatusCode.InternalServerError, ErrorType.Update)).toBeUndefined();
    });

    it('throws load/save errors when no account is available', async () => {
        const deliveryProps = deliveryAndReturnProps('Q-5', emptyAccounts, instance, accountDetails, statuses, 'Accept quote');
        const paymentProps = paymentDetailsProps('Q-5', emptyAccounts, instance, accountDetails, statuses, 'Accept quote');
        const recipientProps = reportRecipientProps('Q-5', 'RFQ-5', emptyAccounts, instance, accountDetails, statuses, 'Accept quote');
        const summaryProps = summaryAndAcceptProps('Q-5', emptyAccounts, instance, accountDetails, statuses, 'Accept quote');

        await expect(deliveryProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(deliveryProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<DeliveryAndReturnStep>(),
        )).rejects.toThrow('No authenticated account available to save form.');
        await expect(paymentProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(paymentProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<PaymentDetailsStep>(),
        )).rejects.toThrow('No authenticated account available to save form.');
        await expect(recipientProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(recipientProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<ReportRecipientStep>(),
        )).rejects.toThrow('No authenticated account available to save form.');
        await expect(summaryProps.loadStepValues?.()).rejects.toThrow('There was an error retrieving your details.');
        await expect(summaryProps.onSaveAndExit?.(
            {},
            false,
            formikHelpers<SummaryAndAcceptStep>(),
        )).rejects.toThrow('No authenticated account available to save form.');
    });
});
