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

vi.mock('@azure/msal-react', () => ({
  useAccount: () => mocks.account,
  useMsal: () => ({
    accounts: mocks.accounts,
    inProgress: mocks.inProgress,
    instance: { acquireTokenSilent: mocks.acquireTokenSilent },
  }),
}));

vi.mock('@/api/web-api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof WebApiClientModule>()),
  AddressClient,
}));

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
  props: Record<string, unknown> = {}
) =>
  render(
    <FieldHarness field='address' defaultValue={address}>
      <RhfAddressLookup name='address' label='Postal address' {...props} />
      <TouchedProbe />
    </FieldHarness>
  );

const formValue = () =>
  JSON.parse(screen.getByTestId('value').textContent) as Record<
    string,
    unknown
  >;

const search = (text: string) =>
  userEvent.type(
    screen.getByRole('combobox', { name: 'Postal address' }),
    text
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
    resetMocks();
    renderLookup(
      { id: 7, type: 'postal', timeStamp: 'stamp', searchText: '' },
      { maxResults: 1 }
    );

    await search('barton');
    await userEvent.click(
      await screen.findByRole('option', { name: /1 National Circuit/ })
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
      })
    );

    expect(mocks.setAuthToken).toHaveBeenCalledWith('unit-token');
    expect(mocks.addressSearch).toHaveBeenCalledWith(
      'barton',
      expect.any(AbortSignal)
    );
  });

  it('falls back to blanks and the default label for sparse matches', async () => {
    resetMocks([
      { addressLine2: 'Suite 2', addressLine3: 'Building A', state: 'NSW' },
    ]);
    renderLookup(undefined, { label: undefined });

    await userEvent.type(
      screen.getByRole('combobox', { name: 'Address' }),
      'sparse'
    );
    await userEvent.click((await screen.findAllByRole('option'))[0]!);

    await waitFor(() =>
      expect(formValue()).toMatchObject({
        line1: '',
        line2: 'Suite 2',
        suburb: '',
        postcode: '',
        searchText: '',
      })
    );
  });

  it('clears the address when the search text is cleared', async () => {
    resetMocks();
    renderLookup({
      id: 2,
      line1: 'Existing',
      searchText: 'Existing address',
      isManuallyEntered: false,
    });

    await userEvent.clear(
      screen.getByRole('combobox', { name: 'Postal address' })
    );

    await waitFor(() => expect(formValue()['line1']).toBe(''));

    expect(formValue()).toMatchObject({
      id: 2,
      isManuallyEntered: false,
      searchText: '',
    });
  });
});

describe('rhfAddressLookup results', () => {
  it.each([
    ['no signed-in account', () => (mocks.account = null)],
    ['an empty account list', () => (mocks.accounts = [])],
    ['authentication in progress', () => (mocks.inProgress = 'login')],
  ])('offers manual entry without searching for %s', async (_name, setup) => {
    resetMocks();
    setup();
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ })
    ).resolves.toBeInTheDocument();
    expect(mocks.addressSearch).not.toHaveBeenCalled();
  });

  it('treats a response without matches as no match', async () => {
    resetMocks();
    mocks.addressSearch.mockResolvedValue({ matches: undefined });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ })
    ).resolves.toBeInTheDocument();
  });

  it('shows no unavailable message for a non-503 failure', async () => {
    resetMocks();
    mocks.addressSearch.mockRejectedValue({ status: 500 });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ })
    ).resolves.toBeInTheDocument();
  });

  it('does not log the typed address when a search fails', async () => {
    resetMocks();
    const failure = { status: 500 };
    mocks.addressSearch.mockRejectedValue(failure);
    const logError = vi.spyOn(AppLogger, 'error').mockImplementation(() => {});
    renderLookup();

    await search('12 Secret Street');

    await waitFor(() => expect(logError).toHaveBeenCalledWith());
    logError.mock.calls.forEach(([message]) =>
      expect(String(message)).not.toContain('Secret')
    );
    logError.mockRestore();
  });

  it('offers manual entry when the address service is unavailable', async () => {
    resetMocks();
    mocks.addressSearch.mockRejectedValue({ status: 503 });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /currently unavailable/ })
    ).resolves.toBeInTheDocument();
  });

  it('aborts the in-flight request when a new search starts', async () => {
    resetMocks();
    let firstSignal: AbortSignal | undefined;
    mocks.addressSearch
      .mockImplementationOnce((_term: string, signal: AbortSignal) => {
        firstSignal = signal;
        return new Promise(() => undefined);
      })
      .mockResolvedValue({ matches: [] });
    renderLookup();

    await search('first');

    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
  });
});

describe('rhfAddressLookup manual entry', () => {
  it('switches to manual entry and back, clearing the touched search text', async () => {
    resetMocks();
    renderLookup(
      { searchText: 'Existing', isManuallyEntered: false },
      { disabled: true, inlineHelp: 'Help' }
    );
    await search('ab');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByTestId('touched')).toHaveTextContent('searchText')
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Enter it manually/ })
    );

    expect(
      screen.getByRole('group', { name: /Postal address.*manually/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Address line 1' })
    ).toBeDisabled();
    expect(formValue()).toMatchObject({
      isManuallyEntered: true,
      searchText: 'Existing',
    });
    expect(screen.getByTestId('touched')).not.toHaveTextContent('searchText');

    await userEvent.click(
      screen.getByRole('button', { name: /Find an address/ })
    );

    expect(
      screen.getByRole('combobox', { name: 'Postal address' })
    ).toHaveValue('Existing');
    expect(formValue()['isManuallyEntered']).toBe(false);
  });

  it('switches to blank manual entry from a no-match result', async () => {
    resetMocks([]);
    renderLookup({ id: 1, searchText: '', isManuallyEntered: false });

    await search('missing');
    await userEvent.click(
      await screen.findByRole('option', { name: /No matches found/ })
    );

    expect(
      screen.getByRole('group', { name: /Postal address.*manually/ })
    ).toBeInTheDocument();
    expect(formValue()).toMatchObject({
      id: 1,
      line1: '',
      isManuallyEntered: true,
      searchText: '',
    });
  });
});

describe('rhfAddressLookup summary', () => {
  it('renders the formatted address', () => {
    resetMocks();
    renderLookup(
      {
        line1: '1 National Circuit',
        suburb: 'Barton',
        state: 'ACT',
        postcode: '2600',
      },
      { isSummary: true }
    );

    expect(screen.getByText('Postal address')).toBeInTheDocument();
    expect(document.body).toHaveTextContent(
      /1 National Circuit.*Barton ACT 2600/s
    );
  });

  it('renders a dash when there is no address', () => {
    resetMocks();
    render(
      <FieldHarness field='address' defaultValue={undefined}>
        <RhfAddressLookup name='address' label='Postal address' isSummary />
      </FieldHarness>
    );

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
