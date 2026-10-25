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
  import('@azure/msal-react'),
  () =>
    ({
      useMsal: () => ({
        instance: { acquireTokenSilent: mocks.acquireTokenSilent },
        accounts: [mocks.account],
        inProgress: 'none',
      }),
      useAccount: () => mocks.account,
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock(import('@/api/web-api-client'), async (importOriginal) => {
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
  import('@/instrumentation/AppLogger'),
  () =>
    ({
      default: { verbose: vi.fn(), error: vi.fn() },
    }) satisfies __ExactMockModule<__TestMockModule5>,
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
            hidingFields,
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
    expect.assertions(2);
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness
        values={{ returnAddressType: ReturnAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Enter it manually/ }));
    await user.type(screen.getByLabelText('Address line 1'), '9 Test Street');
    await user.type(screen.getByLabelText('Suburb'), 'Lindfield');
    await user.type(screen.getByLabelText('Postcode'), '2070');
    await user.selectOptions(screen.getByLabelText('State'), 'NSW');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

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
});

describe(DeliveryAndReturnFormikBridge, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token' });
    mocks.search.mockResolvedValue({ matches: [] });
  });
  it('loads Formik values into RHF fields and mirrors subsequent edits back', async () => {
    expect.assertions(3);
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
      />,
    );

    const organisationName = screen.getByLabelText(
      'Return organisation name (optional)',
    );

    expect(organisationName).toHaveValue('Loaded return organisation');

    await user.clear(organisationName);
    await user.type(organisationName, 'Edited return organisation');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(submitted(onSubmit)).toMatchObject({
      returnOrganisationName: 'Edited return organisation',
    });
  });
});
