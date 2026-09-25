import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AcceptQuotePreInfoDto } from '@/api/web-api-client';
import type * as WebApiClientModule from '@/api/web-api-client';
import PaymentDetails from '@/routes/acceptQuote/paymentDetails';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { acquireTokenSilentMock, msalContext } = vi.hoisted(() => {
    const acquireTokenSilentMock = vi.fn();
    // Stable object prevents useEffect re-firing due to new object identity on every useMsal() call
    const msalContext = {
        accounts: [{ homeAccountId: 'test-account' }],
        instance: { acquireTokenSilent: acquireTokenSilentMock },
    };
    return { acquireTokenSilentMock, msalContext };
});

const mockGetPaymentDetails = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@azure/msal-react', () => ({
    useMsal: () => msalContext,
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof WebApiClientModule>();
    return {
        ...actual,
        AcceptQuoteClient: vi.fn(function(this: Record<string, unknown>) {
            this.setAuthToken = vi.fn();
            this.getPaymentDetails = mockGetPaymentDetails;
        }),
    };
});

vi.mock('@/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn() },
}));

// Stub form-input children — they require Formik context which is outside this component's scope
vi.mock('@/components/Inputs/TextInput', () => ({
    default: ({ name }: { name: string }) => <div data-testid={`text-input`} data-name={name} />,
}));
vi.mock('@/components/Inputs/RadioButtonGroup', () => ({
    default: ({ name }: { name: string }) => <div data-testid={`radio-group`} data-name={name} />,
}));
vi.mock('@/components/forms/HidableField', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/forms/CommonForms/ContactDetails', () => ({
    default: () => <div data-testid='contact-details' />,
}));
vi.mock('@/components/BlockUISpinner', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='spinner'>{children}</div>
    ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePreInfo(paymentTerms: string): { acceptQuotePreInfo: AcceptQuotePreInfoDto } {
    return {
        acceptQuotePreInfo: { paymentTerms } as AcceptQuotePreInfoDto,
    };
}

const defaultProps = { id: 'TEST-001' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PaymentDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        acquireTokenSilentMock.mockResolvedValue({ accessToken: 'test-token' });
        msalContext.instance.acquireTokenSilent = acquireTokenSilentMock;
        mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
    });

    describe('info Alert visibility', () => {
        it('renders the info Alert in non-summary mode', () => {
            acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));
            render(<PaymentDetails {...defaultProps} />);
            expect(screen.getByTestId('info-summary')).toBeInTheDocument();
        });

        it('does not render the info Alert in summary mode', () => {
            acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));
            render(<PaymentDetails {...defaultProps} isSummary />);
            expect(screen.queryByTestId('info-summary')).not.toBeInTheDocument();
        });
    });

    describe('payment-terms conditional copy', () => {
        it('shows the 30-day invoice warning when paymentTerms is not Prepaid', async () => {
            mockGetPaymentDetails.mockResolvedValue(makePreInfo('Standard'));
            render(<PaymentDetails {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText(/30 days of NMI invoice date/)).toBeInTheDocument();
            });
            expect(screen.queryByText(/Prepayment required/)).not.toBeInTheDocument();
        });

        it('shows the prepayment required notice when paymentTerms is Prepaid', async () => {
            mockGetPaymentDetails.mockResolvedValue(makePreInfo('Prepaid'));
            render(<PaymentDetails {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Prepayment required/)).toBeInTheDocument();
            });
            expect(screen.queryByText(/30 days of NMI invoice date/)).not.toBeInTheDocument();
        });
    });

    describe('loading spinner', () => {
        it('shows the spinner during the API fetch in non-summary mode', () => {
            acquireTokenSilentMock.mockReturnValue(new Promise(() => {})); // never resolves

            render(<PaymentDetails {...defaultProps} />);

            expect(screen.getByTestId('spinner')).toBeInTheDocument();
        });

        it('does not show the spinner in summary mode even while loading', () => {
            acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));

            render(<PaymentDetails {...defaultProps} isSummary />);

            expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        });
    });

    describe('field name prefixing (getNameForUse)', () => {
        it('passes raw key names to inputs in non-summary mode', async () => {
            render(<PaymentDetails {...defaultProps} />);

            await waitFor(() => {
                expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
            });

            expect(screen.getByTestId('text-input')).toHaveAttribute('data-name', 'purchaseOrderNo');
            expect(screen.getByTestId('radio-group')).toHaveAttribute('data-name', 'invoiceSentTo');
        });

        it('prefixes key names with paymentDetails. in summary mode', () => {
            acquireTokenSilentMock.mockReturnValue(new Promise(() => {}));
            render(<PaymentDetails {...defaultProps} isSummary />);

            expect(screen.getByTestId('text-input')).toHaveAttribute(
                'data-name',
                'paymentDetails.purchaseOrderNo',
            );
            expect(screen.getByTestId('radio-group')).toHaveAttribute(
                'data-name',
                'paymentDetails.invoiceSentTo',
            );
        });
    });

    describe('API error handling', () => {
        it('logs an error and remains rendered when the API call fails', async () => {
            const AppLogger = (await import('@/instrumentation/AppLogger')).default;
            acquireTokenSilentMock.mockRejectedValue(new Error('Token failed'));

            render(<PaymentDetails {...defaultProps} />);

            await waitFor(() => {
                expect(AppLogger.error).toHaveBeenCalledWith(
                    'Failed to load Payment details',
                    expect.any(Error),
                    { Id: 'TEST-001' },
                );
            });
            expect(screen.getByTestId('info-summary')).toBeInTheDocument();
        });
    });
});
