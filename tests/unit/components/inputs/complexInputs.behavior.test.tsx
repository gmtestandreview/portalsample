import { describe, afterEach, beforeEach, it, expect } from 'vitest';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import {
  Form,
  Formik,
  type FormikErrors,
  type FormikTouched,
  useFormikContext,
} from 'formik';

import { MemoryRouter } from 'react-router';

import AddressLookup from '@/components/Inputs/AddressLookup';

import AutoSuggest from '@/components/Inputs/AutoSuggest';

import AutoSuggestContainer from '@/components/Inputs/AutoSuggest/AutoSuggestContainer';

import AutoSuggestOptions from '@/components/Inputs/AutoSuggest/AutoSuggestOptions';

import ManualAddressInput from '@/components/Inputs/AddressLookup/ManualAddressInput';

import NumberInput from '@/components/Inputs/NumberInput';

import OrganisationNameLookup from '@/components/Inputs/OrganisationNameLookup';

import CertificateNumberLookup from '@/components/Inputs/CertificateNumberLookup';

import type * as WebApiClientModule from '@/api/web-api-client';

import { installUnexpectedConsoleGuard } from '../../../helpers/unexpectedConsoleGuard';

import { defined } from '../../helpers/defined';

type MockAccount = { homeAccountId: string } | null;

function AddressClient() {
  return {
    setAuthToken: mocks.setAuthToken,
    search: mocks.addressSearch,
  };
}

const mocks: {
  acquireTokenSilent: ReturnType<typeof vi.fn>;
  account: MockAccount;
  accounts: Array<{ homeAccountId: string }>;
  addressSearch: ReturnType<typeof vi.fn>;
  inProgress: string;
  setAuthToken: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'unit-token' }),
  account: { homeAccountId: 'account-1' },
  accounts: [{ homeAccountId: 'account-1' }],
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

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AddressClient,
  } satisfies __ExactMockModule<__TestMockModule4>;
});

interface FormikHarnessProps {
  readonly initialValues: Record<string, unknown>;
  readonly initialTouched?: FormikTouched<Record<string, any>>;
  readonly initialErrors?: FormikErrors<Record<string, unknown>>;
  readonly children: React.ReactNode;
}

function FormikHarness({
  initialValues,
  initialTouched,
  initialErrors,
  children,
}: FormikHarnessProps) {
  return (
    <MemoryRouter>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        {...(initialTouched === undefined ? {} : { initialTouched })}
        {...(initialErrors === undefined ? {} : { initialErrors })}
        onSubmit={vi.fn()}
      >
        <Form>{children}</Form>
      </Formik>
    </MemoryRouter>
  );
}

function ValuesProbe() {
  const { values, touched } = useFormikContext<Record<string, unknown>>();
  return (
    <>
      <pre data-testid='values'>{JSON.stringify(values)}</pre>
      <pre data-testid='touched'>{JSON.stringify(touched)}</pre>
    </>
  );
}

describe('complex input behavior slice', () => {
  installUnexpectedConsoleGuard();
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account = { homeAccountId: 'account-1' };
    mocks.accounts = [{ homeAccountId: 'account-1' }];
    mocks.inProgress = 'none';
    mocks.addressSearch.mockResolvedValue({
      matches: [
        {
          displayText: '1 National Circuit, Barton ACT 2600',
          unqiueId: 'address-1',
          addressLine1: '1 National Circuit',
          addressLine2: '',
          addressLine3: '',
          suburb: 'Barton',
          postCode: '2600',
          state: 'ACT',
        },
      ],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('renders ManualAddressInput fields with labels and updates nested values', async () => {
    expect.assertions(3);
    const user = userEvent.setup();

    render(
      <FormikHarness initialValues={{ address: { line1: '', state: '' } }}>
        <ManualAddressInput name='address' />
        <ValuesProbe />
      </FormikHarness>,
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Address line 1' }),
      '15 Lab Street',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Suburb' }),
      'Lindfield',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'State' }),
      'NSW',
    );

    await waitFor(() => {
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"line1":"15 Lab Street"',
      );
      expect(screen.getByTestId('values')).toHaveTextContent(
        '"suburb":"Lindfield"',
      );
      expect(screen.getByTestId('values')).toHaveTextContent('"state":"NSW"');
    });
  });
});
