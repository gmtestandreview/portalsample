import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountDispatchCtx, AccountStateCtx } from '@/authentication/accountContext';
import type { AccountDispatchContext, AccountStateContext } from '@/authentication/accountContext';
import useUserServices from '@/hooks/useUserServices';

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

const ServicesProbe = () => {
    const services = useUserServices() as Array<{ serviceName: string }>;

    return (
        <output aria-label='Services'>
            {services.map((service) => service.serviceName).join(',') || 'none'}
        </output>
    );
};

describe('useUserServices', () => {
    it('returns an empty service list when no account context is available', () => {
        render(<ServicesProbe />);

        expect(screen.getByRole('status', { name: 'Services' })).toHaveTextContent('none');
    });

    it('returns services from the authenticated user profile', () => {
        const services = [
            { serviceName: 'Pattern approval' },
            { serviceName: 'Calibration' },
        ];
        const stateContext = {
            details: {
                userProfile: {
                    services,
                },
            },
        } as unknown as AccountStateContext;

        render(
            <AccountStateCtx.Provider value={stateContext}>
                <AccountDispatchCtx.Provider value={dispatchContext}>
                    <ServicesProbe />
                </AccountDispatchCtx.Provider>
            </AccountStateCtx.Provider>,
        );

        expect(screen.getByRole('status', { name: 'Services' }))
            .toHaveTextContent('Pattern approval,Calibration');
    });

    it('returns an empty service list when the profile has no services', () => {
        const stateContext = {
            details: {
                userProfile: {},
            },
        } as unknown as AccountStateContext;

        render(
            <AccountStateCtx.Provider value={stateContext}>
                <AccountDispatchCtx.Provider value={dispatchContext}>
                    <ServicesProbe />
                </AccountDispatchCtx.Provider>
            </AccountStateCtx.Provider>,
        );

        expect(screen.getByRole('status', { name: 'Services' })).toHaveTextContent('none');
    });
});
