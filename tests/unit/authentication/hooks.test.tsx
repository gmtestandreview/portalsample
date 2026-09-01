import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAccountContext, { useAccountDispatch, useAccountState } from '@/authentication/hooks';
import { AccountDispatchCtx, AccountStateCtx } from '@/authentication/accountContext';
import type {
    AccountDispatchContext,
    AccountStateContext,
} from '@/authentication/accountContext';

const dispatchContext: AccountDispatchContext = {
    setAgree: vi.fn(),
    setCompleted: vi.fn(),
    setContactCompleted: vi.fn(),
    setDefaultOrganisationId: vi.fn(),
    setTargetOrganisation: vi.fn(),
    setOrganisationAndBranch: vi.fn(),
    setShowBranchSelector: vi.fn(),
    setShowRFQSelectModal: vi.fn(),
    setUserProfile: vi.fn().mockResolvedValue(true),
};

const stateContext: AccountStateContext = {
    isLoading: false,
    details: {
        organisation: 'National Measurement Institute',
        trading: 'Trading name',
        branch: 'Canberra',
        homeAccountId: 'account-1',
        userAcceptedTermsOfUse: true,
        accountCreationCompleted: true,
        accountContactCompleted: true,
        currentTermsVersion: '1',
        organisationIsCompleted: true,
        isDefaultOrganisation: true,
        showBranchSelector: false,
    },
};

const AccountProbe = () => {
    const combined = useAccountContext();
    const state = useAccountState();
    const dispatch = useAccountDispatch();

    return (
        <>
            <output aria-label='Combined account'>
                {combined?.details?.organisation ?? 'none'}
            </output>
            <output aria-label='State account'>
                {state?.details?.organisation ?? 'none'}
            </output>
            <output aria-label='Dispatch account'>
                {dispatch ? 'available' : 'none'}
            </output>
        </>
    );
};

describe('authentication hooks', () => {
    it('return null when rendered without account providers', () => {
        render(<AccountProbe />);

        expect(screen.getByRole('status', { name: 'Combined account' })).toHaveTextContent('none');
        expect(screen.getByRole('status', { name: 'State account' })).toHaveTextContent('none');
        expect(screen.getByRole('status', { name: 'Dispatch account' })).toHaveTextContent('none');
    });

    it('returns the direct state and dispatch contexts and merges them for the default hook', () => {
        render(
            <AccountStateCtx.Provider value={stateContext}>
                <AccountDispatchCtx.Provider value={dispatchContext}>
                    <AccountProbe />
                </AccountDispatchCtx.Provider>
            </AccountStateCtx.Provider>,
        );

        expect(screen.getByRole('status', { name: 'Combined account' }))
            .toHaveTextContent('National Measurement Institute');
        expect(screen.getByRole('status', { name: 'State account' }))
            .toHaveTextContent('National Measurement Institute');
        expect(screen.getByRole('status', { name: 'Dispatch account' }))
            .toHaveTextContent('available');
    });

    it('returns a partial combined context when only account state is provided', () => {
        render(
            <AccountStateCtx.Provider value={stateContext}>
                <AccountProbe />
            </AccountStateCtx.Provider>,
        );

        expect(screen.getByRole('status', { name: 'Combined account' }))
            .toHaveTextContent('National Measurement Institute');
        expect(screen.getByRole('status', { name: 'Dispatch account' })).toHaveTextContent('none');
    });

    it('returns a partial combined context when only account dispatch is provided', () => {
        render(
            <AccountDispatchCtx.Provider value={dispatchContext}>
                <AccountProbe />
            </AccountDispatchCtx.Provider>,
        );

        expect(screen.getByRole('status', { name: 'Combined account' })).toHaveTextContent('none');
        expect(screen.getByRole('status', { name: 'Dispatch account' })).toHaveTextContent('available');
    });
});
