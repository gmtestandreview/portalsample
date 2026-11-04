import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '@/authentication/accountContext';
import type {
  AccountDispatchContext,
  AccountStateContext,
} from '@/authentication/accountContext';
import useUserServices from '@/hooks/useUserServices';

const dispatchContext: AccountDispatchContext = {
  setAgree: vi.fn<(...args: unknown[]) => void>(),
  setCompleted: vi.fn<(...args: unknown[]) => void>(),
  setContactCompleted: vi.fn<(...args: unknown[]) => void>(),
  setDefaultOrganisationId: vi.fn<(...args: unknown[]) => void>(),
  setTargetOrganisation: vi.fn<(...args: unknown[]) => void>(),
  setOrganisationAndBranch: vi.fn<(...args: unknown[]) => void>(),
  setShowBranchSelector: vi.fn<(...args: unknown[]) => void>(),
  setShowRFQSelectModal: vi.fn<(...args: unknown[]) => void>(),
  setUserProfile: vi.fn<(...args: unknown[]) => Promise<boolean>>().mockResolvedValue(true),
};

const ServicesProbe = () => {
  const services = useUserServices() as { serviceName: string }[];

  return (
    <output aria-label='Services'>
      {services.map((service) => service.serviceName).join(',') || 'none'}
    </output>
  );
};

// function suite titles are required by vitest/prefer-describe-function-title.
describe(useUserServices, () => {
  it('returns an empty service list when no account context is available', () => {
    expect.hasAssertions();

    render(<ServicesProbe />);

    expect(screen.getByRole('status', { name: 'Services' })).toHaveTextContent(
      'none',
    );
  });

  it('returns services from the authenticated user profile', () => {
    expect.hasAssertions();

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

    expect(screen.getByRole('status', { name: 'Services' })).toHaveTextContent(
      'Pattern approval,Calibration',
    );
  });

  it('returns an empty service list when the profile has no services', () => {
    expect.hasAssertions();

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

    expect(screen.getByRole('status', { name: 'Services' })).toHaveTextContent(
      'none',
    );
  });
});
