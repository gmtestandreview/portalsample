import { render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

vi.mock(
  import('../../../ClientApp/src/components/Inputs/TextInput'),
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`text-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/NumberInput'),
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`number-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule30>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/Checkbox'),
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`checkbox-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule79>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/AddressLookup'),
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`address-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule31>,
);

vi.mock(
  import('../../../ClientApp/src/components/Inputs/OrganisationNameLookup'),
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`organisation-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule80>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/HidableField'),
  () =>
    ({
      default: ({
        children,
        name,
      }: {
        children: React.ReactNode;
        name: string;
      }) => <div data-testid={`hidable-${name}`}>{children}</div>,
    }) satisfies __ExactMockModule<__TestMockModule70>,
);

vi.mock(
  import('../../../ClientApp/src/components/forms/CommonForms/ContactDetails'),
  () =>
    ({
      default: ({ name, roleLabel }: { name: string; roleLabel: string }) => (
        <div data-testid='contact-details-input' data-name={name}>
          {roleLabel}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule71>,
);

describe('account and contact display sections', () => {
  it('renders account details fields', async () => {
    expect.assertions(5);
    const AccountDetails = (
      await import('../../../ClientApp/src/routes/account/accountDetails')
    ).default;

    render(<AccountDetails />);

    expect(
      screen.getByRole('heading', { name: 'Organisation details' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('number-abn')).toHaveTextContent('ABN');
    expect(
      screen.getByTestId('organisation-businessOrTradingName'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('address-streetAddress')).toHaveLength(1);
    expect(screen.getByTestId('address-postalAddress')).toBeInTheDocument();
  });
});
