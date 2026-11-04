import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, Formik, useFormikContext } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type * as WebApiClientModule from '@/api/web-api-client';
import {
  ReportAddressTypeValues,
  type AddressDetailsDto,
  type ReportRecipientStep,
} from '@/api/web-api-client';
import ReportRecipientFormikBridge from '@/routes/acceptQuote/reportRecipientFormikBridge';
import { reportRecipientSubmitValidation } from '@/routes/acceptQuote/validation';
import { removeHidden, validateForm } from '@/components/forms/utils';
import { defined } from '../../helpers/defined';

const mocks = vi.hoisted(() => ({
  acquireTokenSilent: vi.fn<(...args: unknown[]) => unknown>(),
  search: vi.fn<(...args: unknown[]) => unknown>(),
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
    }) satisfies __ExactMockModule<__TestMockModule2>,
);

vi.mock('@/api/web-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof WebApiClientModule>();
  return {
    ...actual,
    AddressClient: class {
      setAuthToken = vi.fn<(...args: unknown[]) => unknown>();
      search = mocks.search;
    },
  } satisfies __ExactMockModule<__TestMockModule4>;
});

vi.mock(
  '@/instrumentation/AppLogger',
  () =>
    ({
      default: {
        verbose: vi.fn<(...args: unknown[]) => unknown>(),
        error: vi.fn<(...args: unknown[]) => unknown>(),
      },
    }) satisfies __ExactMockModule<__TestMockModule5>,
);

const hidingFields = {
  businessStreetAddress: (x: ReportRecipientStep) =>
    x.reportAddressType !== ReportAddressTypeValues.Other,
};

interface HarnessProps {
  values?: ReportRecipientStep;
  withHiddenRules?: boolean;
  status?: unknown;
  onSubmit?: (values: ReportRecipientStep) => void;
}

function Probe() {
  const { values, dirty } = useFormikContext<ReportRecipientStep>();
  return (
    <output data-testid='probe'>
      {JSON.stringify({ address: values.businessStreetAddress, dirty })}
    </output>
  );
}

function Harness({
  values = {},
  withHiddenRules = true,
  status,
  onSubmit = vi.fn<(...args: unknown[]) => unknown>(),
}: Readonly<HarnessProps>) {
  return (
    <Formik<ReportRecipientStep>
      initialValues={values}
      initialStatus={
        status ?? (withHiddenRules ? { hidden: hidingFields } : undefined)
      }
      validate={validateForm(reportRecipientSubmitValidation, hidingFields)}
      onSubmit={(submitted) => {
        onSubmit(removeHidden(submitted, submitted, hidingFields));
      }}
    >
      <Form noValidate>
        <ReportRecipientFormikBridge />
        <Probe />
        <button type='submit'>Continue</button>
      </Form>
    </Formik>
  );
}

const resetReportRecipientFormikBridgeMocks = () => {
  vi.clearAllMocks();
  mocks.acquireTokenSilent.mockResolvedValue({ accessToken: 'token' });
  mocks.search.mockResolvedValue({ matches: [] });
};

// function suite titles are required by vitest/prefer-describe-function-title.
describe(ReportRecipientFormikBridge, () => {
  it('mirrors a manually entered address into the outer submit payload', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: ReportRecipientStep) => void>();
    render(
      <Harness
        values={{ reportAddressType: ReportAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Enter it manually/ }));
    await user.type(screen.getByLabelText('Address line 1'), '9 Test Street');
    await user.type(screen.getByLabelText('Suburb'), 'Lindfield');
    await user.type(screen.getByLabelText('Postcode'), '2070');
    await user.selectOptions(screen.getByLabelText('State'), 'NSW');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(defined(onSubmit.mock.calls[0], 'submit call')[0]).toMatchObject({
      reportAddressType: ReportAddressTypeValues.Other,
      businessStreetAddress: {
        isManuallyEntered: true,
        line1: '9 Test Street',
        suburb: 'Lindfield',
        postcode: '2070',
        state: 'NSW',
      },
    });
  });

  it('loads Formik values into RHF fields and mirrors subsequent edits back', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: ReportRecipientStep) => void>();
    render(
      <Harness
        values={{
          reportAddressType: ReportAddressTypeValues.Other,
          businessStreetAddress: {
            isManuallyEntered: true,
            line1: '9 Test Street',
            suburb: 'Lindfield',
            postcode: '2070',
            state: 'NSW' as AddressDetailsDto['state'],
          },
          organisationName: 'Loaded report organisation',
        }}
        onSubmit={onSubmit}
      />,
    );

    const organisationName = screen.getByLabelText(
      'Organisation name for report',
    );

    expect(organisationName).toHaveValue('Loaded report organisation');

    await user.clear(organisationName);
    await user.type(organisationName, 'Edited report organisation');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(defined(onSubmit.mock.calls[0], 'submit call')[0]).toMatchObject({
      organisationName: 'Edited report organisation',
    });
  });

  it('mirrors a selected address as a whole object', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

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
    const onSubmit = vi.fn<(values: ReportRecipientStep) => void>();
    render(
      <Harness
        values={{ reportAddressType: ReportAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByRole('combobox'), '1 Street');
    await user.click(
      await screen.findByText('1 Street Road, Lindfield NSW 2070'),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(defined(onSubmit.mock.calls[0], 'submit call')[0]).toMatchObject({
      businessStreetAddress: {
        isManuallyEntered: false,
        line1: '1 Street Road',
        postcode: '2070',
        searchText: '1 Street Road, Lindfield NSW 2070',
      },
    });
  });

  it('shows address messages after a failed submit', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: ReportRecipientStep) => void>();
    render(
      <Harness
        values={{ reportAddressType: ReportAddressTypeValues.Other }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Enter it manually/ }));

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByText(/Address line 1 is required/i),
    ).resolves.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not dirty the outer form when a failed submit touches an empty address', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    render(
      <Harness
        values={{
          reportAddressType: ReportAddressTypeValues.Other,
          businessStreetAddress: {},
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/is required/i);

    expect(
      JSON.parse(screen.getByTestId('probe').textContent ?? ''),
    ).toStrictEqual({
      address: {},
      dirty: false,
    });
  });

  it('leaves an undefined address undefined and the outer form clean after a failed submit', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    render(
      <Harness values={{ reportAddressType: ReportAddressTypeValues.Other }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/is required/i);

    const probe = JSON.parse(screen.getByTestId('probe').textContent ?? '') as {
      address?: unknown;
      dirty: boolean;
    };

    expect(probe.dirty).toBe(false);
    expect(probe.address).toBeUndefined();
  });

  it('describes the failed address search field by its message', async () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const user = userEvent.setup();
    render(
      <Harness values={{ reportAddressType: ReportAddressTypeValues.Other }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await expect(
      screen.findByRole('combobox'),
    ).resolves.toHaveAccessibleDescription(/is required/i);
  });

  it('shows the address without hide rules when the form has no status', () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    const { unmount } = render(<Harness />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    unmount();

    render(<Harness withHiddenRules={false} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('falls back to no hide rules when the status has non-object hidden rules', () => {
    expect.hasAssertions();

    resetReportRecipientFormikBridgeMocks();

    render(<Harness status={{ hidden: null }} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
