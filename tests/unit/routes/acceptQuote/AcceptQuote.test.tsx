import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type * as ReactRouterModule from 'react-router';
import type * as WebApiClientModule from '../../../../ClientApp/src/api/web-api-client';
import type { AccountDetails } from '../../../../ClientApp/src/authentication/accountContext';

const mocks = vi.hoisted(() => {
    const acquireTokenSilent = vi.fn();
    const instance = { acquireTokenSilent };
    return {
        acquireTokenSilent,
        instance,
        msalAccounts: [{ homeAccountId: 'account-1' }] as { homeAccountId: string }[],
        setAuthToken: vi.fn(),
        getStepStatuses: vi.fn(),
        getQuoteRequestDetails: vi.fn(),
        appLoggerError: vi.fn(),
        appLoggerVerbose: vi.fn(),
        useAccountState: vi.fn(),
        navigate: vi.fn(),
    };
});

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: mocks.msalAccounts,
        instance: mocks.instance,
    }),
}));

vi.mock('react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof ReactRouterModule>();
    return {
        ...actual,
        useNavigate: () => mocks.navigate,
    };
});

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: mocks.useAccountState,
}));

vi.mock('../../../../ClientApp/src/authentication/authConfig', () => ({
    tokenRequest: { scopes: ['scope'] },
}));

vi.mock('../../../../ClientApp/src/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
        ...actual,
        AcceptQuoteClient: vi.fn(function AcceptQuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getStepStatuses: mocks.getStepStatuses,
            };
        }),
        QuoteClient: vi.fn(function QuoteClientMock() {
            return {
                setAuthToken: mocks.setAuthToken,
                getQuoteRequestDetails: mocks.getQuoteRequestDetails,
            };
        }),
    };
});

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: {
        error: mocks.appLoggerError,
        verbose: mocks.appLoggerVerbose,
    },
}));

vi.mock('../../../../ClientApp/src/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="block-spinner">{children}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: () => {},
}));

vi.mock('../../../../ClientApp/src/components/forms/WizardForm', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wizard-form">{children}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/forms/WizardForm/WizardStep', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wizard-step">{children}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/reportRecipient', () => ({
    default: () => <div data-testid="step-report-recipient" />,
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn', () => ({
    default: () => <div data-testid="step-delivery-and-return" />,
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/paymentDetails', () => ({
    default: () => <div data-testid="step-payment-details" />,
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/summaryAndAccept', () => ({
    default: () => <div data-testid="step-summary-and-accept" />,
}));

vi.mock('../../../../ClientApp/src/routes/acceptQuote/reportRecipientProps', () => ({
    default: () => ({}),
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturnProps', () => ({
    default: () => ({}),
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/paymentDetailsProps', () => ({
    default: () => ({}),
}));
vi.mock('../../../../ClientApp/src/routes/acceptQuote/summaryAndAcceptProps', () => ({
    default: () => ({}),
}));

const accountDetails = { homeAccountId: 'account-1', givenName: 'Alex', familyName: 'Tester' } as AccountDetails;
const stepStatus = [{ crmQuoteRequestId: 'CRM-Q-42', status: 'Saved' }];

describe('AcceptQuote container', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.msalAccounts.splice(0, mocks.msalAccounts.length, { homeAccountId: 'account-1' });
        mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'access-token' });
        mocks.useAccountState.mockReturnValue({ details: accountDetails });
        mocks.getStepStatuses.mockResolvedValue(stepStatus);
        mocks.getQuoteRequestDetails.mockResolvedValue({ quoteRequestIdNum: 'RFQ-NUM-42' });
    });

    const renderAcceptQuote = async () => {
        const AcceptQuote = (await import('../../../../ClientApp/src/routes/acceptQuote/index')).default;
        return render(
            <MemoryRouter initialEntries={['/accept-quote/Q-42']}>
                <Routes>
                    <Route path="/accept-quote/:id" element={<AcceptQuote />} />
                    <Route path="/not-found" element={<div data-testid="not-found" />} />
                </Routes>
            </MemoryRouter>,
        );
    };

    it('shows the loading spinner while step statuses are being fetched', async () => {
        mocks.getStepStatuses.mockReturnValue(new Promise(() => {})); // never resolves
        await renderAcceptQuote();

        expect(screen.getByTestId('block-spinner')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('wizard-form')).not.toBeInTheDocument();
    });

    it('renders the four-step WizardForm once step statuses resolve', async () => {
        await renderAcceptQuote();

        await waitFor(() => expect(screen.getByTestId('wizard-form')).toBeInTheDocument());

        expect(screen.queryByTestId('block-spinner')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('wizard-step')).toHaveLength(4);
        expect(screen.getByTestId('step-report-recipient')).toBeInTheDocument();
        expect(screen.getByTestId('step-delivery-and-return')).toBeInTheDocument();
        expect(screen.getByTestId('step-payment-details')).toBeInTheDocument();
        expect(screen.getByTestId('step-summary-and-accept')).toBeInTheDocument();
    });

    it('fetches quote request details using the crmQuoteRequestId from step statuses', async () => {
        await renderAcceptQuote();

        await waitFor(() => expect(mocks.getQuoteRequestDetails).toHaveBeenCalledWith('CRM-Q-42'));
        expect(screen.getByTestId('wizard-form')).toBeInTheDocument();
    });

    it('navigates to /not-found and logs when getStepStatuses rejects', async () => {
        mocks.getStepStatuses.mockRejectedValue(new Error('network error'));
        await renderAcceptQuote();

        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/not-found'));
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load quote request details',
            expect.any(Error),
            { Id: 'Q-42' },
        );
    });

    it('navigates to /not-found and logs when getQuoteRequestDetails rejects', async () => {
        mocks.getQuoteRequestDetails.mockRejectedValue(new Error('quote details error'));
        await renderAcceptQuote();

        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/not-found'));
        expect(mocks.appLoggerError).toHaveBeenCalledWith(
            'Failed to load quote request details',
            expect.any(Error),
            { Id: 'Q-42' },
        );
    });

    it('stays on the loading spinner and does not call the API when no MSAL account is present', async () => {
        mocks.msalAccounts.length = 0;
        await renderAcceptQuote();

        expect(screen.getByTestId('block-spinner')).toBeInTheDocument();
        // Drain microtasks so any effect that could have fired has had its chance
        await new Promise<void>((r) => { setTimeout(r, 0); });
        expect(mocks.getStepStatuses).not.toHaveBeenCalled();
    });
});
