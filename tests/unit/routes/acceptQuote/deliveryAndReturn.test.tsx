import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Formik, Form } from 'formik';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import type { AddressDetailsDto } from '../../../../ClientApp/src/api/web-api-client';
import DeliveryAndReturn from '../../../../ClientApp/src/routes/acceptQuote/deliveryAndReturn';

// ─── hoisted mock refs ────────────────────────────────────────────────────────
// vi.mock factories run before imports, so shared vi.fn() references must be
// hoisted to the same level via vi.hoisted().
//
// accounts and instance must be stable object references — if useMsal() returns
// new objects each render, the useEffect (which lists them as deps) re-fires
// every render, causing an infinite fetch loop in tests.

const mocks = vi.hoisted(() => {
    const acquireTokenSilent = vi.fn().mockResolvedValue({ accessToken: 'mock-token' });
    const getDeliveryAndReturn = vi.fn();
    const accounts = [{ homeAccountId: 'mock-id' }];
    const instance = { acquireTokenSilent };
    return { acquireTokenSilent, getDeliveryAndReturn, accounts, instance };
});

// ─── module mocks ─────────────────────────────────────────────────────────────

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        instance: mocks.instance,
        accounts: mocks.accounts,
        inProgress: 'none',
    }),
    useAccount: () => ({ homeAccountId: 'mock-id' }),
}));

vi.mock('../../../../ClientApp/src/authentication/hooks', () => ({
    useAccountState: () => ({
        isLoading: false,
        details: { homeAccountId: 'mock-id' },
    }),
}));

// AcceptQuoteClient, AccountsClient, Title, and State are all consumed by the
// component or its children. Title must be a real-shaped object so that
// ContactDetailsInput's getTitles() can iterate over it without crashing.
vi.mock('../../../../ClientApp/src/api/web-api-client', () => ({
    AcceptQuoteClient: class {
        setAuthToken = vi.fn();
        getDeliveryAndReturn = mocks.getDeliveryAndReturn;
    },
    AccountsClient: class {
        setAuthToken = vi.fn();
    },
    Title: {
        Mr: 'Mr', Mrs: 'Mrs', Miss: 'Miss', Ms: 'Ms',
        Dr: 'Dr', Sir: 'Sir', AssociateProfessor: 'AssociateProfessor',
        Professor: 'Professor',
    },
    State: {
        ACT: 'ACT', NSW: 'NSW', TAS: 'TAS', VIC: 'VIC',
        QLD: 'QLD', NT: 'NT', SA: 'SA', WA: 'WA',
    },
}));

vi.mock('../../../../ClientApp/src/instrumentation/AppLogger', () => ({
    default: { verbose: vi.fn(), error: vi.fn() },
}));

// ─── render helper ────────────────────────────────────────────────────────────

function makeTree(id: string, isSummary?: boolean): ReactNode {
    return (
        <MemoryRouter>
            <Formik initialValues={{}} initialStatus={{ hidden: {} }} onSubmit={() => {}}>
                <Form noValidate>
                    <DeliveryAndReturn id={id} isSummary={isSummary} />
                </Form>
            </Formik>
        </MemoryRouter>
    );
}

function renderComponent(props: { id?: string; isSummary?: boolean } = {}) {
    return render(makeTree(props.id ?? 'test-id', props.isSummary));
}

// ─── fixtures ─────────────────────────────────────────────────────────────────

const streetAddr: AddressDetailsDto = {
    line1: '10 Park St', suburb: 'Sydney', state: 'NSW' as never, postcode: '2000',
};
const postalAddr: AddressDetailsDto = {
    line1: '20 Postal Ave', suburb: 'Melbourne', state: 'VIC' as never, postcode: '3000',
};
const otherAddr: AddressDetailsDto = {
    line1: '30 Other Rd', suburb: 'Brisbane', state: 'QLD' as never, postcode: '4000',
};

const baseApiResponse = {
    acceptQuotePreInfo: { receiptAndDispatchNA: false, quotationIdNum: 'Q-2024-001' },
    rfqOrganisation: {
        streetAddress: streetAddr,
        postalAddressSameAsStreetAddress: false,
        postalAddress: postalAddr,
    },
    returnAddress: otherAddr,
    returnOrganisationName: 'Test Organisation',
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('DeliveryAndReturn', () => {
    beforeEach(() => {
        mocks.getDeliveryAndReturn.mockReset();
    });

    // 1. receiptAndDispatchNA = true ───────────────────────────────────────────
    describe('receiptAndDispatchNA=true', () => {
        it('shows the no-delivery message inside the info banner in form mode', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                acceptQuotePreInfo: { receiptAndDispatchNA: true },
            });
            renderComponent();
            await waitFor(() =>
                expect(
                    screen.getByText(/does not require the delivery or return/i),
                ).toBeInTheDocument(),
            );
            expect(
                screen.queryByRole('heading', { name: /Instrument\/artefact delivery/i }),
            ).not.toBeInTheDocument();
            // Drain setIsLoading(false) and any Formik re-renders still in the
            // microtask queue so they don't fire outside act() after the test ends.
            await act(async () => {});
        });

        it('shows the no-delivery alert panel in summary mode and hides the delivery section', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                acceptQuotePreInfo: { receiptAndDispatchNA: true },
            });
            renderComponent({ isSummary: true });
            await waitFor(() =>
                expect(
                    screen.getByText(/does not require the delivery or return/i),
                ).toBeInTheDocument(),
            );
            expect(
                screen.queryByRole('heading', { name: /Instrument\/artefact delivery/i }),
            ).not.toBeInTheDocument();
            await act(async () => {});
        });
    });

    // 2. returnAddressType switch in summary mode ──────────────────────────────
    describe('returnAddressType address resolution in summary mode', () => {
        it('BusinessAddress renders the street address', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                ...baseApiResponse,
                returnAddressType: 'BusinessAddress',
            });
            renderComponent({ isSummary: true });
            await waitFor(() =>
                expect(screen.getByText(/Sydney NSW 2000/)).toBeInTheDocument(),
            );
            await act(async () => {});
        });

        it('PostalAddress with postalAddressSameAsStreetAddress=true falls back to street address', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                ...baseApiResponse,
                rfqOrganisation: {
                    ...baseApiResponse.rfqOrganisation,
                    postalAddressSameAsStreetAddress: true,
                },
                returnAddressType: 'PostalAddress',
            });
            renderComponent({ isSummary: true });
            await waitFor(() =>
                expect(screen.getByText(/Sydney NSW 2000/)).toBeInTheDocument(),
            );
            await act(async () => {});
        });

        it('PostalAddress with postalAddressSameAsStreetAddress=false renders the postal address', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                ...baseApiResponse,
                returnAddressType: 'PostalAddress',
            });
            renderComponent({ isSummary: true });
            await waitFor(() =>
                expect(screen.getByText(/Melbourne VIC 3000/)).toBeInTheDocument(),
            );
            await act(async () => {});
        });

        it('Other renders the custom returnAddress', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                ...baseApiResponse,
                returnAddressType: 'Other',
            });
            renderComponent({ isSummary: true });
            await waitFor(() =>
                expect(screen.getByText(/Brisbane QLD 4000/)).toBeInTheDocument(),
            );
            await act(async () => {});
        });
    });

    // 3. Re-fetch on id change — regression test for the exhaustive-deps fix ──
    describe('re-fetch on id prop change', () => {
        it('calls the API again when id changes', async () => {
            mocks.getDeliveryAndReturn.mockResolvedValue({
                acceptQuotePreInfo: { receiptAndDispatchNA: true },
            });
            const { rerender } = render(makeTree('q-1'));
            await waitFor(() =>
                expect(mocks.getDeliveryAndReturn).toHaveBeenCalledWith('q-1'),
            );

            rerender(makeTree('q-2'));
            await waitFor(() =>
                expect(mocks.getDeliveryAndReturn).toHaveBeenCalledWith('q-2'),
            );
            expect(mocks.getDeliveryAndReturn).toHaveBeenCalledTimes(2);
            await act(async () => {});
        });
    });

    // 4. API error — component must not crash ──────────────────────────────────
    describe('API error', () => {
        it('renders the info banner and does not crash when getDeliveryAndReturn rejects', async () => {
            mocks.getDeliveryAndReturn.mockRejectedValue(new Error('Network error'));
            renderComponent();
            // Wait until the API call has been attempted — the effect has fired.
            await waitFor(() =>
                expect(mocks.getDeliveryAndReturn).toHaveBeenCalled(),
            );
            // Drain queued state updates (setIsLoading(false) from catch block,
            // plus any Formik re-renders) so they don't fire outside act().
            await act(async () => {});
            // Component must still be mounted with the info banner visible.
            expect(screen.getByTestId('info-summary')).toBeInTheDocument();
        });
    });
});
