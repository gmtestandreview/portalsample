import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../ClientApp/src/components/Inputs/TextInput', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid={`text-${name}`}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/NumberInput', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid={`number-${name}`}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/Checkbox', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid={`checkbox-${name}`}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/AddressLookup', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid={`address-${name}`}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/Inputs/OrganisationNameLookup', () => ({
    default: ({ label, name }: { label: string; name: string }) => <div data-testid={`organisation-${name}`}>{label}</div>,
}));

vi.mock('../../../ClientApp/src/components/forms/HidableField', () => ({
    default: ({ children, name }: { children: React.ReactNode; name: string }) => (
        <div data-testid={`hidable-${name}`}>{children}</div>
    ),
}));

vi.mock('../../../ClientApp/src/components/forms/CommonForms/ContactDetails', () => ({
    default: ({ name, roleLabel }: { name: string; roleLabel: string }) => (
        <div data-testid="contact-details-input" data-name={name}>{roleLabel}</div>
    ),
}));

describe('account and contact display sections', () => {
    it('renders account details fields', async () => {
        const AccountDetails = (await import('../../../ClientApp/src/routes/account/accountDetails')).default;

        render(<AccountDetails />);

        expect(screen.getByRole('heading', { name: 'Organisation details' })).toBeInTheDocument();
        expect(screen.getByTestId('number-abn')).toHaveTextContent('ABN');
        expect(screen.getByTestId('organisation-businessOrTradingName')).toBeInTheDocument();
        expect(screen.getAllByTestId('address-streetAddress')).toHaveLength(1);
        expect(screen.getByTestId('address-postalAddress')).toBeInTheDocument();
    });

    it('renders organisation details fields', async () => {
        const OrganisationDetails = (await import('../../../ClientApp/src/routes/account/organisationDetails')).default;

        render(<OrganisationDetails />);

        expect(screen.getByRole('heading', { name: 'Organisation details' })).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-isDefaultOrganisation')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-postalAddressSameAsStreetAddress')).toBeInTheDocument();
        expect(screen.getByTestId('hidable-postalAddress')).toBeInTheDocument();
    });

    it('renders contact information and the contact details form section', async () => {
        const ContactDetails = (await import('../../../ClientApp/src/routes/contact/contactDetails')).default;

        render(<ContactDetails />);

        expect(screen.getByRole('status')).toHaveTextContent('Important information');
        expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
        expect(screen.getByTestId('contact-details-input')).toHaveAttribute('data-name', 'contact');
        expect(screen.getByTestId('contact-details-input')).toHaveTextContent('Role (optional)');
    });
});
