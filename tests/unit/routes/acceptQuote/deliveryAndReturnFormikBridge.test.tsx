import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  type AddressDetailsDto,
  type DeliveryAndReturnStep,
} from '@/api/web-api-client';
import { deliveryAndReturnHidingFields } from '@/routes/acceptQuote/deliveryAndReturnProps';
import ErrorSummary from '@/components/forms/ErrorSummary';
import { MemoryRouter } from 'react-router';
import DeliveryAndReturnFormikBridge from '@/routes/acceptQuote/deliveryAndReturnFormikBridge';
import {
  deliveryAndReturnSaveValidation,
  deliveryAndReturnSubmitValidation,
} from '@/routes/acceptQuote/validation';
import { removeHidden, validateForm } from '@/components/forms/utils';
import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn(),
  search: vi.fn(),
  account: { homeAccountId: 'mock-id' },
}));

vi.mock(
  '@azure/msal-react',
  () =>
    ({
      useMsal: () => ({
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
        accounts: [mocks.account],
        inProgress: 'none',
      }),
      useAccount: () => mocks.account,
    }) satisfies __ExactMockModule<__TestMockModule2>
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AddressClient: class {
      setAuthToken = vi.fn();
      search = mocks.search;
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>
);

const hidingFields = deliveryAndReturnHidingFields;

type Values = DeliveryAndReturnStep & { saveAndExit?: boolean };

interface HarnessProps {
  values?: Values;
  withHiddenRules?: boolean;
  withErrorSummary?: boolean;
  onSubmit?: (values: DeliveryAndReturnStep) => void;
}

function Probe() {
  const { values, dirty } = useFormikContext<Values>();
  return (
    <output data-testid='probe'>
      {JSON.stringify({ address: values.returnAddress, dirty })}
    </output>
  );
}

function Harness({
  values = {},
  withHiddenRules = true,
  withErrorSummary = false,
  onSubmit = vi.fn(),
}: Readonly<HarnessProps>) {
  return (
    <MemoryRouter>
      <Formik<Values>
        initialValues={values}
        {...(withHiddenRules
          ? { initialStatus: { hidden: hidingFields } }
          : {})}
        validate={(formValues) =>
          validateForm(
            formValues.saveAndExit
              ? deliveryAndReturnSaveValidation
              : deliveryAndReturnSubmitValidation,
            hidingFields
          )(formValues)
        }
        onSubmit={(submitted) =>
          onSubmit(removeHidden(submitted, submitted, hidingFields))
        }
      >
        <Form noValidate>
          {withErrorSummary && <ErrorSummary />}
          <DeliveryAndReturnFormikBridge />
          <Probe />
          <button type='submit'>Continue</button>
        </Form>
      </Formik>
    </MemoryRouter>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>) =>
  defined(onSubmit.mock.calls[0], 'submit call')[0];

describe(DeliveryAndReturnFormikBridge, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token' });
    mocks.search.mockResolvedValue({ matches: [] });
  });

  it('mirrors a manually entered return address into the submit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{ returnAddressType: ReturnAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /Enter it manually/ }));
    await user.type(screen.getByLabelText('Address line 1'), '9 Test Street');
    await user.type(screen.getByLabelText('Suburb'), 'Lindfield');
    await user.type(screen.getByLabelText('Postcode'), '2070');
    await user.selectOptions(screen.getByLabelText('State'), 'NSW');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submitted(onSubmit)).toMatchObject({
      returnAddressType: ReturnAddressTypeValues.Other,
      returnAddress: {
        isManuallyEntered: true,
        line1: '9 Test Street',
        suburb: 'Lindfield',
        postcode: '2070',
        state: 'NSW',
      },
    });
  });

  it('loads Formik values into RHF fields and mirrors subsequent edits back', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          returnAddressType: ReturnAddressTypeValues.Other,
          returnAddress: {
            isManuallyEntered: true,
            line1: '9 Test Street',
            suburb: 'Lindfield',
            postcode: '2070',
            state: 'NSW' as AddressDetailsDto['state'],
          },
          returnOrganisationName: 'Loaded return organisation',
        }}
        onSubmit={onSubmit}
      />
    );

    const organisationName = screen.getByLabelText(
      'Return organisation name (optional)'
    );

    expect(organisationName).toHaveValue('Loaded return organisation');

    await user.clear(organisationName);
    await user.type(organisationName, 'Edited return organisation');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submitted(onSubmit)).toMatchObject({
      returnOrganisationName: 'Edited return organisation',
    });
  });

  it('mirrors a selected return address as a whole object', async () => {
    mocks.search.mockResolvedValue({
      matches: [
        {
          unqiueId: 'a-1',
          displayText: '1 Street Road, Lindfield NSW 2070',
          addressLine1: '1 Street Road',
          suburb: 'Lindfield',
          postCode: '2070',
          state: 'NSW',
        },
      ],
    });
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{ returnAddressType: ReturnAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />
    );

    await user.type(
      screen.getByRole('combobox', { name: /Return address/ }),
      '1 Street'
    );
    await user.click(
      await screen.findByText('1 Street Road, Lindfield NSW 2070')
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(submitted(onSubmit)).toMatchObject({
      returnAddress: {
        isManuallyEntered: false,
        line1: '1 Street Road',
        postcode: '2070',
        searchText: '1 Street Road, Lindfield NSW 2070',
      },
    });
  });

  it('shows address messages only after a failed submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{ returnAddressType: ReturnAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /Enter it manually/ }));

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(/Address line 1 is required/i)
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows messages for fields that were never given a value', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        values={{
          returnContactType: ReturnContactTypeValues.DifferentPerson,
          returnMethod: ReturnMethodValues.ClientWillProvide,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText('Carrier name is required')
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Carrier name')).toBeInvalid();
    expect(screen.getByLabelText('Carrier name')).toHaveAccessibleDescription(
      'Carrier name is required'
    );
  });

  it('does not dirty the outer form when a failed submit touches an undefined address', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        values={{
          returnAddressType: ReturnAddressTypeValues.Other,
          returnAddress: undefined as never,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/is required/i);

    const probe = JSON.parse(screen.getByTestId('probe').textContent ?? '');

    expect(probe.dirty).toBe(false);
    expect(probe.address).toBeUndefined();
  });

  it('applies the soft schema once the outer form is saving and exiting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{
          returnContactType: ReturnContactTypeValues.DifferentPerson,
          returnMethod: ReturnMethodValues.ClientWillProvide,
          saveAndExit: true,
        }}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledExactlyOnceWith());

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();
  });

  it('follows the hide rules from the form status', () => {
    const { unmount } = render(
      <Harness
        values={{ returnContactType: ReturnContactTypeValues.SamePerson }}
      />
    );

    expect(screen.queryByLabelText('Carrier name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: /Return address/ })
    ).not.toBeInTheDocument();

    unmount();

    render(<Harness withHiddenRules={false} />);

    expect(screen.getByLabelText('Carrier name')).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /Return address/ })
    ).toBeInTheDocument();
  });

  it('renders a field for every error summary link after a failed submit', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        withErrorSummary
        values={{
          returnContactType: ReturnContactTypeValues.DifferentPerson,
          returnAddressType: ReturnAddressTypeValues.Other,
          returnMethod: ReturnMethodValues.ClientWillProvide,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const summary = await screen.findByTestId('form-error-summary');
    const keys = within(summary)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href')?.replace(/^#/, '') ?? '');

    expect(keys).toEqual(
      expect.arrayContaining(['carrierName', 'contact.firstName'])
    );
    expect(keys.some((key) => key.startsWith('returnAddress'))).toBe(true);

    keys.forEach((key) =>
      expect(document.getElementById(key), key).not.toBeNull()
    );
  });
});
