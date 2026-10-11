import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
  ReturnAddressTypeValues,
  ReturnContactTypeValues,
  ReturnMethodValues,
  type DeliveryAndReturnStep,
} from '@/api/web-api-client';
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

vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: { acquireTokenSilent: mocks.acquireTokenSilent },
    accounts: [mocks.account],
    inProgress: 'none',
  }),
  useAccount: () => mocks.account,
}));

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AddressClient: class {
      setAuthToken = vi.fn();
      search = mocks.search;
    },
  };
});

vi.mock('@/instrumentation/AppLogger', () => ({
  default: { verbose: vi.fn(), error: vi.fn() },
}));

const hidingFields = {
  contactHide: (x: DeliveryAndReturnStep) =>
    x.returnContactType === 'SamePerson',
  contact: {
    titleOther: (x: DeliveryAndReturnStep) => x.contact?.title !== 'Other',
  },
  returnAddress: (x: DeliveryAndReturnStep) => x.returnAddressType !== 'Other',
  carrierHide: (x: DeliveryAndReturnStep) =>
    x.returnMethod !== 'ClientWillProvide',
};

type Values = DeliveryAndReturnStep & { saveAndExit?: boolean };

interface HarnessProps {
  values?: Values;
  withHiddenRules?: boolean;
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
  onSubmit = vi.fn(),
}: Readonly<HarnessProps>) {
  return (
    <Formik<Values>
      initialValues={values}
      {...(withHiddenRules ? { initialStatus: { hidden: hidingFields } } : {})}
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
        <DeliveryAndReturnFormikBridge />
        <Probe />
        <button type='submit'>Continue</button>
      </Form>
    </Formik>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>) =>
  defined(onSubmit.mock.calls[0], 'submit call')[0];

describe('DeliveryAndReturnFormikBridge', () => {
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

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
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

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
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

    expect(
      await screen.findByText(/Address line 1 is required/i)
    ).toBeInTheDocument();
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

    expect(
      await screen.findByText('Carrier name is required')
    ).toBeInTheDocument();
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

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
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
});
