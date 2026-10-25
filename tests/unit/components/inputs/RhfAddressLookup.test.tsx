import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { useFormContext } from 'react-hook-form';

import { describe, expect, it, vi } from 'vitest';

import RhfAddressLookup from '@/components/Inputs/RhfAddressLookup';

import type * as WebApiClientModule from '@/api/web-api-client';

import AppLogger from '@/instrumentation/AppLogger';

import { FieldHarness } from './rhfTestHarness';

function AddressClient() {
  return { setAuthToken: mocks.setAuthToken, search: mocks.addressSearch };
}

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  account: { homeAccountId: 'account-1' } as { homeAccountId: string } | null,
  accounts: [{ homeAccountId: 'account-1' }] as { homeAccountId: string }[],
  addressSearch: vi.fn(),
  inProgress: 'none',
  setAuthToken: vi.fn(),
}));

vi.mock(
  import('@azure/msal-react'),
  () =>
    ({
      useAccount: () => mocks.account,
      useMsal: () => ({
        accounts: mocks.accounts,
        inProgress: mocks.inProgress,
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(
  import('@/api/web-api-client'),
  async (importOriginal) =>
    ({
      ...(await importOriginal<typeof WebApiClientModule>()),
      AddressClient,
    }) satisfies __ExactMockModule<__TestMockModule4>,
);

const match = {
  displayText: '1 National Circuit, Barton ACT 2600',
  unqiueId: 'address-1',
  addressLine1: '1 National Circuit',
  addressLine2: '',
  addressLine3: '',
  suburb: 'Barton',
  postCode: '2600',
  state: 'ACT',
};

const TouchedProbe = () => {
  const { formState } = useFormContext();
  return (
    <output data-testid='touched'>
      {JSON.stringify(formState.touchedFields)}
    </output>
  );
};

const renderLookup = (
  address: Record<string, unknown> = {
    searchText: '',
    isManuallyEntered: false,
  },
  props: Record<string, unknown> = {},
) =>
  render(
    <FieldHarness field='address' defaultValue={address}>
      <RhfAddressLookup name='address' label='Postal address' {...props} />
      <TouchedProbe />
    </FieldHarness>,
  );

const formValue = () =>
  JSON.parse(screen.getByTestId('value').textContent) as Record<
    string,
    unknown
  >;

const search = (text: string) =>
  userEvent.type(
    screen.getByRole('combobox', { name: 'Postal address' }),
    text,
  );

const resetMocks = (matches: unknown = [match]) => {
  vi.clearAllMocks();
  mocks.account = { homeAccountId: 'account-1' };
  mocks.accounts = [{ homeAccountId: 'account-1' }];
  mocks.inProgress = 'none';
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'unit-token' });
  mocks.addressSearch.mockResolvedValue({ matches });
};

describe('rhfAddressLookup selection', () => {
  it('writes the chosen address and keeps the identifying fields', async () => {
    expect.assertions(3);
    resetMocks();
    renderLookup(
      { id: 7, type: 'postal', timeStamp: 'stamp', searchText: '' },
      { maxResults: 1 },
    );

    await search('barton');
    await userEvent.click(
      await screen.findByRole('option', { name: /1 National Circuit/ }),
    );

    await waitFor(() =>
      expect(formValue()).toEqual({
        id: 7,
        type: 'postal',
        timeStamp: 'stamp',
        state: 'ACT',
        line1: '1 National Circuit',
        line2: '',
        line3: '',
        suburb: 'Barton',
        postcode: '2600',
        isManuallyEntered: false,
        searchText: match.displayText,
      }),
    );

    expect(mocks.setAuthToken).toHaveBeenCalledWith('unit-token');
    expect(mocks.addressSearch).toHaveBeenCalledWith(
      'barton',
      expect.any(AbortSignal),
    );
  });
});

describe('rhfAddressLookup selection', () => {
  it('falls back to blanks and the default label for sparse matches', async () => {
    expect.assertions(1);
    resetMocks([
      { addressLine2: 'Suite 2', addressLine3: 'Building A', state: 'NSW' },
    ]);
    renderLookup(undefined, { label: undefined });

    await userEvent.type(
      screen.getByRole('combobox', { name: 'Address' }),
      'sparse',
    );
    await userEvent.click((await screen.findAllByRole('option'))[0]!);

    await waitFor(() =>
      expect(formValue()).toMatchObject({
        line1: '',
        line2: 'Suite 2',
        suburb: '',
        postcode: '',
        searchText: '',
      }),
    );
  });
});
