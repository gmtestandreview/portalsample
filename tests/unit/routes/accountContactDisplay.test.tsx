import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../ClientApp/src/components/forms/CommonForms/RhfContactDetails',
  () =>
    ({
      default: ({ name, roleLabel }: { name: string; roleLabel: string }) => (
        <div data-testid='contact-details-input' data-name={name}>
          {roleLabel}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule168>,
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfTextInput',
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`text-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule162>,
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfNumberInput',
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`number-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule163>,
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfCheckbox',
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`checkbox-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule164>,
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfAddressLookup',
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`address-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule165>,
);

vi.mock(
  '../../../ClientApp/src/components/Inputs/RhfOrganisationNameLookup',
  () =>
    ({
      default: ({ label, name }: { label: string; name: string }) => (
        <div data-testid={`organisation-${name}`}>{label}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule166>,
);

vi.mock(
  '../../../ClientApp/src/components/forms/RhfHidableField',
  () =>
    ({
      default: ({
        children,
        name,
      }: {
        children: React.ReactNode;
        name: string;
      }) => <div data-testid={`hidable-${name}`}>{children}</div>,
    }) satisfies __ExactMockModule<__TestMockModule167>,
);

describe('account and contact display sections', () => {
  it('renders account details fields', async () => {
    expect.hasAssertions();

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

  it('renders organisation details fields', async () => {
    expect.hasAssertions();

    const OrganisationDetails = (
      await import('../../../ClientApp/src/routes/account/organisationDetails')
    ).default;

    render(<OrganisationDetails />);

    expect(
      screen.getByRole('heading', { name: 'Organisation details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('checkbox-isDefaultOrganisation'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('checkbox-postalAddressSameAsStreetAddress'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hidable-postalAddress')).toBeInTheDocument();
  });

  it('renders contact information and the contact details form section', async () => {
    expect.hasAssertions();

    const ContactDetails = (
      await import('../../../ClientApp/src/routes/contact/contactDetails')
    ).default;

    render(<ContactDetails />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Important information',
    );
    expect(
      screen.getByRole('heading', { name: 'Contact' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('contact-details-input')).toHaveAttribute(
      'data-name',
      'contact',
    );
    expect(screen.getByTestId('contact-details-input')).toHaveTextContent(
      'Role (optional)',
    );
  });
});
