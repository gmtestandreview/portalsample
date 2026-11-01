import { render, screen, waitFor } from '@testing-library/react';
import type { IPublicClientApplication } from '@azure/msal-browser';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import RhfAddressLookup from '@/components/Inputs/RhfAddressLookup';
import { State } from '@/api/web-api-client';
import type * as WebApiClientModule from '@/api/web-api-client';
import AppLogger from '@/instrumentation/AppLogger';
import { FieldHarness } from './rhfTestHarness';

type AcquireTokenSilent = IPublicClientApplication['acquireTokenSilent'];
type AddressClientInstance = InstanceType<
  typeof WebApiClientModule.AddressClient
>;
type AddressSearch = AddressClientInstance['search'];
type SetAuthToken = AddressClientInstance['setAuthToken'];
type MatchedAddress = WebApiClientModule.MatchedAddress;

function AddressClient() {
  return { setAuthToken: mocks.setAuthToken, search: mocks.addressSearch };
}

const mocks = vi.hoisted(() => {
  const accountState: { account: { homeAccountId: string } | null } = {
    account: { homeAccountId: 'account-1' },
  };
  return {
    acquireTokenSilent: vi.fn<AcquireTokenSilent>(),
    account: accountState.account,
    accounts: [{ homeAccountId: 'account-1' }] as { homeAccountId: string }[],
    addressSearch: vi.fn<AddressSearch>(),
    inProgress: 'none',
    setAuthToken: vi.fn<SetAuthToken>(),
  };
});

vi.mock(
  import('@azure/msal-react'),
  (() =>
    ({
      useAccount: () => mocks.account,
      useMsal: () => ({
        accounts: mocks.accounts,
        inProgress: mocks.inProgress,
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
      }),
    }) satisfies __ExactMockModule<__TestMockModule2>) as unknown as __DynamicPartialMockFactory<__TestMockModule2>,
);

vi.mock(
  import('@/api/web-api-client'),
  (async (
    importOriginal: <
      TOriginal = typeof WebApiClientModule,
    >() => Promise<TOriginal>,
  ) =>
    ({
      ...(await importOriginal<typeof WebApiClientModule>()),
      AddressClient,
    }) satisfies __ExactMockModule<__TestMockModule4>) as unknown as __DynamicPartialMockFactory<__TestMockModule4>,
);

const match: MatchedAddress = {
  displayText: '1 National Circuit, Barton ACT 2600',
  unqiueId: 'address-1',
  addressLine1: '1 National Circuit',
  addressLine2: '',
  addressLine3: '',
  suburb: 'Barton',
  postCode: '2600',
  state: State.ACT,
};

const tokenResult: Awaited<ReturnType<AcquireTokenSilent>> = {
  authority: 'https://unit.test',
  uniqueId: 'unit-id',
  tenantId: 'unit-tenant',
  scopes: [],
  account: {
    homeAccountId: 'account-1',
    environment: 'unit.test',
    tenantId: 'unit-tenant',
    username: 'unit@example.test',
    localAccountId: 'local-1',
  },
  idToken: '',
  idTokenClaims: {},
  accessToken: 'unit-token',
  fromCache: false,
  expiresOn: null,
  tokenType: 'Bearer',
  correlationId: 'unit-correlation',
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

const resetMocks = (matches: MatchedAddress[] | undefined = [match]) => {
  vi.clearAllMocks();
  mocks.account = { homeAccountId: 'account-1' };
  mocks.accounts = [{ homeAccountId: 'account-1' }];
  mocks.inProgress = 'none';
  mocks.acquireTokenSilent.mockResolvedValue(tokenResult);
  mocks.addressSearch.mockResolvedValue({ matches });
};

describe('rhfAddressLookup selection', () => {
  it('writes the chosen address and keeps the identifying fields', async () => {
    expect.hasAssertions();

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
      expect(formValue()).toStrictEqual({
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

  it('falls back to blanks and the default label for sparse matches', async () => {
    expect.hasAssertions();

    resetMocks([
      {
        addressLine2: 'Suite 2',
        addressLine3: 'Building A',
        state: State.NSW,
      },
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

  it('clears the address when the search text is cleared', async () => {
    expect.hasAssertions();

    resetMocks();
    renderLookup({
      id: 2,
      line1: 'Existing',
      searchText: 'Existing address',
      isManuallyEntered: false,
    });

    await userEvent.clear(
      screen.getByRole('combobox', { name: 'Postal address' }),
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
    expect.hasAssertions();

    resetMocks();
    setup();
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ }),
    ).resolves.toBeInTheDocument();
    expect(mocks.addressSearch).not.toHaveBeenCalled();
  });

  it('treats a response without matches as no match', async () => {
    expect.hasAssertions();

    resetMocks();
    mocks.addressSearch.mockResolvedValue({ matches: undefined });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ }),
    ).resolves.toBeInTheDocument();
  });

  it('shows no unavailable message for a non-503 failure', async () => {
    expect.hasAssertions();

    resetMocks();
    mocks.addressSearch.mockRejectedValue({ status: 500 });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /No matches found/ }),
    ).resolves.toBeInTheDocument();
  });

  it('does not log the typed address when a search fails', async () => {
    expect.hasAssertions();

    resetMocks();
    const failure = { status: 500 };
    mocks.addressSearch.mockRejectedValue(failure);
    const logError = vi.spyOn(AppLogger, 'error').mockImplementation(() => {});
    renderLookup();

    await search('12 Secret Street');

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        'Failed to execute address search',
        failure,
      ),
    );
    logError.mock.calls.forEach(([message]) =>
      expect(String(message)).not.toContain('Secret'),
    );
    logError.mockRestore();
  });

  it('offers manual entry when the address service is unavailable', async () => {
    expect.hasAssertions();

    resetMocks();
    mocks.addressSearch.mockRejectedValue({ status: 503 });
    renderLookup();

    await search('query');

    await expect(
      screen.findByRole('option', { name: /currently unavailable/ }),
    ).resolves.toBeInTheDocument();
  });

  it('aborts the in-flight request when a new search starts', async () => {
    expect.hasAssertions();

    resetMocks();
    let firstSignal: AbortSignal | undefined;
    mocks.addressSearch
      .mockImplementationOnce(
        (_term: string | null | undefined, signal?: AbortSignal) => {
          firstSignal = signal;
          return new Promise(() => undefined);
        },
      )
      .mockResolvedValue({ matches: [] });
    renderLookup();

    await search('first');

    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
  });
});

describe('rhfAddressLookup manual entry', () => {
  it('switches to manual entry and back, clearing the touched search text', async () => {
    expect.hasAssertions();

    resetMocks();
    renderLookup(
      { searchText: 'Existing', isManuallyEntered: false },
      { disabled: true, inlineHelp: 'Help' },
    );
    await search('ab');
    await userEvent.tab();
    await waitFor(() =>
      expect(screen.getByTestId('touched')).toHaveTextContent('searchText'),
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Enter it manually/ }),
    );

    expect(
      screen.getByRole('group', { name: /Postal address.*manually/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Address line 1' }),
    ).toBeDisabled();
    expect(formValue()).toMatchObject({
      isManuallyEntered: true,
      searchText: 'Existing',
    });
    expect(screen.getByTestId('touched')).not.toHaveTextContent('searchText');
  });

  it('switches back to lookup mode with the existing search text', async () => {
    expect.hasAssertions();

    resetMocks();
    renderLookup({ searchText: 'Existing', isManuallyEntered: true });

    await userEvent.click(
      screen.getByRole('button', { name: /Find an address/ }),
    );

    expect(
      screen.getByRole('combobox', { name: 'Postal address' }),
    ).toHaveValue('Existing');
    expect(formValue()['isManuallyEntered']).toBe(false);
  });

  it('switches to blank manual entry from a no-match result', async () => {
    expect.hasAssertions();

    resetMocks([]);
    renderLookup({ id: 1, searchText: '', isManuallyEntered: false });

    await search('missing');
    await userEvent.click(
      await screen.findByRole('option', { name: /No matches found/ }),
    );

    expect(
      screen.getByRole('group', { name: /Postal address.*manually/ }),
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
    expect.hasAssertions();

    resetMocks();
    renderLookup(
      {
        line1: '1 National Circuit',
        suburb: 'Barton',
        state: 'ACT',
        postcode: '2600',
      },
      { isSummary: true },
    );

    expect(screen.getByText('Postal address')).toBeInTheDocument();
    expect(document.body.textContent).toMatch(
      /1 National Circuit.*Barton ACT 2600/s,
    );
  });

  it('renders a dash when there is no address', () => {
    expect.hasAssertions();

    resetMocks();
    render(
      <FieldHarness field='address' defaultValue={undefined}>
        <RhfAddressLookup name='address' label='Postal address' isSummary />
      </FieldHarness>,
    );

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
