import { Form, Formik } from 'formik';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';

import OrganisationAndContact from '../../../../ClientApp/src/routes/ta/organisationAndContact';
import SummaryAndSubmit from '../../../../ClientApp/src/routes/ta/summaryAndSubmit';

const mocks = vi.hoisted(() => ({
    useBodyClass: vi.fn(),
    supportingDocumentsUploadAttachment: vi.fn(),
    supportingDocumentsUploadFiles: vi.fn(),
}));

vi.mock('../../../../ClientApp/src/components/Utilities/useBodyClass', () => ({
    default: mocks.useBodyClass,
}));

vi.mock('../../../../ClientApp/src/components/Accordion', () => ({
    CustomAccordion: ({ children, id }: { children: ReactNode; id: string }) => (
        <section data-testid={`accordion-${id}`}>{children}</section>
    ),
    CustomAccordionBody: ({
        children,
        name,
    }: {
        children: ReactNode;
        name: string;
    }) => (
        <div>
            <h2>{name}</h2>
            {children}
        </div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Buttons/EditButton', () => ({
    default: ({ link }: { link: string }) => <a data-testid='edit-link' href={link}>Edit</a>,
}));

vi.mock('../../../../ClientApp/src/components/HeaderIntroText', () => ({
    default: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock('../../../../ClientApp/src/components/InTextLink', () => ({
    default: ({
        children,
        href,
        target,
    }: {
        children: ReactNode;
        href: string;
        target: string;
    }) => <a href={href} target={target}>{children}</a>,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/Checkbox', () => ({
    default: ({
        label,
        name,
        isSummary,
    }: {
        label: string;
        name: string;
        isSummary: boolean;
    }) => (
        <label>
            <input data-testid='checkbox' data-name={name} data-summary={String(isSummary)} type='checkbox' />
            {label}
        </label>
    ),
}));

vi.mock('../../../../ClientApp/src/routes/ta/applicationAndInstrument', () => ({
    default: ({ isSummary, name }: { isSummary?: boolean; name: string }) => (
        <div data-testid='application-and-instrument' data-name={name} data-summary={String(isSummary)} />
    ),
}));

vi.mock('../../../../ClientApp/src/routes/ta/supportingDocuments', () => ({
    default: ({
        isSummary,
        name,
        onUploadAttachment,
        attachment,
    }: {
        isSummary: boolean;
        name: string;
        onUploadAttachment: (token: string, files: File[]) => Promise<unknown[]>;
        attachment: { onUploadFiles: (files: File[]) => Promise<unknown[]> };
    }) => {
        void onUploadAttachment('token', []).then(mocks.supportingDocumentsUploadAttachment);
        void attachment.onUploadFiles([]).then(mocks.supportingDocumentsUploadFiles);

        return (
            <div data-testid='supporting-documents' data-name={name} data-summary={String(isSummary)} />
        );
    },
}));

vi.mock('../../../../ClientApp/src/components/Inputs/RadioButtonGroup', () => ({
    default: ({
        legend,
        name,
        isSummary,
        inlineHelp,
        options,
    }: {
        legend: string;
        name: string;
        isSummary?: boolean;
        inlineHelp?: ReactNode;
        options: Array<{
            label: string;
            descriptor?: ReactNode;
            value: string;
        }>;
    }) => (
        <section data-testid={`radio-${name}`} data-summary={String(isSummary)}>
            <h3>{legend}</h3>
            {inlineHelp ? <div data-testid={`help-${name}`}>{inlineHelp}</div> : null}
            {options.map((option) => (
                <div key={option.value}>
                    <span>{option.label}</span>
                    <div>{option.descriptor}</div>
                </div>
            ))}
        </section>
    ),
}));

vi.mock('../../../../ClientApp/src/components/forms/HidableField', () => ({
    default: ({ children, name }: { children: ReactNode; name: string }) => (
        <div data-testid={`hidable-${name}`}>{children}</div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/TextInput', () => ({
    default: ({
        label,
        name,
        isSummary,
    }: {
        label: string;
        name: string;
        isSummary?: boolean;
    }) => <div data-testid='text-input' data-name={name} data-summary={String(isSummary)}>{label}</div>,
}));

vi.mock('../../../../ClientApp/src/components/Inputs/AddressLookup', () => ({
    default: ({
        label,
        name,
        isSummary,
        maxResults,
        placeholder,
    }: {
        label: string;
        name: string;
        isSummary?: boolean;
        maxResults: number;
        placeholder: string;
    }) => (
        <div
            data-testid='address-lookup'
            data-max-results={maxResults}
            data-name={name}
            data-placeholder={placeholder}
            data-summary={String(isSummary)}
        >
            {label}
        </div>
    ),
}));

vi.mock('../../../../ClientApp/src/components/Inputs/AuthorisedAgent', () => ({
    default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div data-testid='authorised-agent' data-name={name} data-summary={String(isSummary)} />
    ),
}));

vi.mock('../../../../ClientApp/src/components/forms/CommonForms/ContactDetails', () => ({
    default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div data-testid='contact-details' data-name={name} data-summary={String(isSummary)} />
    ),
}));

const formValues = {
    organisationAndContact: {
        currentContact: {
            title: 'Dr',
            firstName: 'Ada',
            lastName: 'Lovelace',
            email: 'ada@example.gov.au',
        },
    },
    currentContact: {
        title: 'Ms',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.gov.au',
    },
};

const renderWithFormik = (children: ReactNode) => render(
    <Formik initialValues={formValues} initialStatus={{ hidden: {} }} onSubmit={() => {}}>
        <Form>{children}</Form>
    </Formik>,
);

const renderSummary = (isSubmitted = false) => render(
    <MemoryRouter initialEntries={['/ta/PA-300/summary']}>
        <Formik initialValues={formValues} initialStatus={{ hidden: {} }} onSubmit={() => {}}>
            <Form>
                <Routes>
                    <Route path='/ta/:id/summary' element={<SummaryAndSubmit isSubmitted={isSubmitted} name='summaryAndSubmit' />} />
                </Routes>
            </Form>
        </Formik>
    </MemoryRouter>,
);

describe('OrganisationAndContact', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the editable organisation and contact fields with prefixed field names', () => {
        renderWithFormik(<OrganisationAndContact isSummary={false} name='organisationAndContact' />);

        expect(screen.getByTestId('radio-organisationAndContact.isManufacturer')).toHaveAttribute('data-summary', 'false');
        expect(screen.getByTestId('text-input')).toHaveAttribute('data-name', 'organisationAndContact.name');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'organisationAndContact.streetAddress');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-max-results', '10');
        expect(screen.getByTestId('authorised-agent')).toHaveAttribute('data-name', 'organisationAndContact.authorisedAgent');
        expect(screen.getAllByTestId('contact-details').map((node) => node.getAttribute('data-name'))).toEqual([
            'organisationAndContact.contact',
            'organisationAndContact.invoiceContact',
        ]);
        expect(screen.getByRole('heading', { name: 'Contact information' })).toBeInTheDocument();

        const principalContact = screen.getByTestId('radio-organisationAndContact.isPrincipalContact');
        expect(principalContact).toHaveTextContent('Use my contact details');
        expect(principalContact).toHaveTextContent('Dr Ada Lovelace');
        expect(principalContact).toHaveTextContent('ada@example.gov.au');
        expect(principalContact).toHaveTextContent('A different contact person');
        expect(screen.getByTestId('help-organisationAndContact.isPrincipalContact')).toHaveTextContent(
            'Dashboard > Settings menu > My contact details',
        );
    });

    it('renders the summary field names without a prefix when no name is supplied', () => {
        renderWithFormik(<OrganisationAndContact isSummary name='' />);

        expect(screen.getByTestId('radio-isManufacturer')).toHaveAttribute('data-summary', 'true');
        expect(screen.getByTestId('text-input')).toHaveAttribute('data-name', 'name');
        expect(screen.getByTestId('address-lookup')).toHaveAttribute('data-name', 'streetAddress');
        expect(screen.getByTestId('authorised-agent')).toHaveAttribute('data-name', 'authorisedAgent');
        expect(screen.getAllByTestId('contact-details').map((node) => node.getAttribute('data-name'))).toEqual([
            'contact',
            'invoiceContact',
        ]);
        expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Contact information' })).not.toBeInTheDocument();

        const principalContact = screen.getByTestId('radio-isPrincipalContact');
        expect(principalContact).toHaveTextContent('Ms Grace Hopper');
        expect(principalContact).toHaveTextContent('grace@example.gov.au');
    });
});

describe('SummaryAndSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.supportingDocumentsUploadAttachment.mockClear();
        mocks.supportingDocumentsUploadFiles.mockClear();
    });

    it('renders editable summary sections with edit links and declaration fields', async () => {
        renderSummary();

        expect(mocks.useBodyClass).toHaveBeenCalledWith('summary');
        expect(screen.getByText(/Before you submit your request/)).toBeInTheDocument();
        expect(screen.getByTestId('application-and-instrument')).toHaveAttribute('data-name', 'applicationAndInstrument');
        expect(screen.getByTestId('supporting-documents')).toHaveAttribute('data-name', 'supportingDocuments.form.documents');
        expect(screen.getAllByTestId('edit-link').map((link) => link.getAttribute('href'))).toEqual([
            '/ta/PA-300/organisation-details',
            '/ta/PA-300/application-details',
            '/ta/PA-300/supporting-documents',
        ]);

        const checkboxes = screen.getAllByTestId('checkbox');
        expect(checkboxes.map((checkbox) => checkbox.getAttribute('data-name'))).toEqual([
            'acceptNMIP106',
            'acceptTermsAndConditions',
            'acceptDeclaration',
        ]);
        expect(within(screen.getByTestId('accordion-applicationTermsAndConditions')).getByText(
            /You must read and accept the NMI P 106/,
        )).toBeInTheDocument();
        expect(screen.getByRole('link', {
            name: 'NMI P 106 Procedures for approval and certification of patterns of measuring instruments (PDF)',
        })).toHaveAttribute('target', '_blank');
        expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
        await expect.poll(() => mocks.supportingDocumentsUploadAttachment).toHaveBeenCalledWith([]);
        await expect.poll(() => mocks.supportingDocumentsUploadFiles).toHaveBeenCalledWith([]);
    });

    it('renders the submitted summary without edit controls and with a dashboard return link', () => {
        renderSummary(true);

        expect(screen.queryByText(/Before you submit your request/)).not.toBeInTheDocument();
        expect(screen.queryByTestId('edit-link')).not.toBeInTheDocument();
        expect(screen.getByTestId('back-button')).toHaveAttribute('href', '/dashboard');
        expect(screen.getByTestId('back-button')).toHaveTextContent('Back to dashboard');
    });
});
