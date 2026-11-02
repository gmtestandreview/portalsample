import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAccountContext, {
  useAccountDispatch,
  useAccountState,
} from '@/authentication/hooks';
import {
  AccountDispatchCtx,
  AccountStateCtx,
} from '@/authentication/accountContext';
import type {
  AccountDispatchContext,
  AccountStateContext,
} from '@/authentication/accountContext';

const dispatchContext: AccountDispatchContext = {
  setAgree: vi.fn<AccountDispatchContext['setAgree']>(),
  setCompleted: vi.fn<AccountDispatchContext['setCompleted']>(),
  setContactCompleted: vi.fn<AccountDispatchContext['setContactCompleted']>(),
  setDefaultOrganisationId:
    vi.fn<AccountDispatchContext['setDefaultOrganisationId']>(),
  setTargetOrganisation:
    vi.fn<AccountDispatchContext['setTargetOrganisation']>(),
  setOrganisationAndBranch:
    vi.fn<AccountDispatchContext['setOrganisationAndBranch']>(),
  setShowBranchSelector:
    vi.fn<AccountDispatchContext['setShowBranchSelector']>(),
  setShowRFQSelectModal:
    vi.fn<AccountDispatchContext['setShowRFQSelectModal']>(),
  setUserProfile: vi
    .fn<AccountDispatchContext['setUserProfile']>()
    .mockResolvedValue(true),
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
    expect.hasAssertions();

    render(<AccountProbe />);

    expect(
      screen.getByRole('status', { name: 'Combined account' }),
    ).toHaveTextContent('none');
    expect(
      screen.getByRole('status', { name: 'State account' }),
    ).toHaveTextContent('none');
    expect(
      screen.getByRole('status', { name: 'Dispatch account' }),
    ).toHaveTextContent('none');
  });

  it('returns the direct state and dispatch contexts and merges them for the default hook', () => {
    expect.hasAssertions();

    render(
      <AccountStateCtx.Provider value={stateContext}>
        <AccountDispatchCtx.Provider value={dispatchContext}>
          <AccountProbe />
        </AccountDispatchCtx.Provider>
      </AccountStateCtx.Provider>,
    );

    expect(
      screen.getByRole('status', { name: 'Combined account' }),
    ).toHaveTextContent('National Measurement Institute');
    expect(
      screen.getByRole('status', { name: 'State account' }),
    ).toHaveTextContent('National Measurement Institute');
    expect(
      screen.getByRole('status', { name: 'Dispatch account' }),
    ).toHaveTextContent('available');
  });

  it('returns a partial combined context when only account state is provided', () => {
    expect.hasAssertions();

    render(
      <AccountStateCtx.Provider value={stateContext}>
        <AccountProbe />
      </AccountStateCtx.Provider>,
    );

    expect(
      screen.getByRole('status', { name: 'Combined account' }),
    ).toHaveTextContent('National Measurement Institute');
    expect(
      screen.getByRole('status', { name: 'Dispatch account' }),
    ).toHaveTextContent('none');
  });

  it('returns a partial combined context when only account dispatch is provided', () => {
    expect.hasAssertions();

    render(
      <AccountDispatchCtx.Provider value={dispatchContext}>
        <AccountProbe />
      </AccountDispatchCtx.Provider>,
    );

    expect(
      screen.getByRole('status', { name: 'Combined account' }),
    ).toHaveTextContent('none');
    expect(
      screen.getByRole('status', { name: 'Dispatch account' }),
    ).toHaveTextContent('available');
  });
});
