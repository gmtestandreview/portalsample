import { Form, Formik } from 'formik';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';

import OrganisationAndContact from '../../../../ClientApp/src/routes/ta/organisationAndContact';
import SummaryAndSubmit from '../../../../ClientApp/src/routes/ta/summaryAndSubmit';

const mocks = vi.hoisted(() => ({
  useBodyClass: vi.fn<(...args: unknown[]) => unknown>(),
  supportingDocumentsUploadAttachment: vi.fn<(...args: unknown[]) => unknown>(),
  supportingDocumentsUploadFiles: vi.fn<(...args: unknown[]) => unknown>(),
}));

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  (() =>
    ({
      default: mocks.useBodyClass,
    }) satisfies __ExactMockModule<__TestMockModule59>) as unknown as __DynamicPartialMockFactory<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Accordion'),
  (() =>
    ({
      CustomAccordion: ({
        children,
        id,
      }: {
        children: ReactNode;
        id: string;
      }) => <section data-testid={`accordion-${id}`}>{children}</section>,
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
    }) satisfies __ExactMockModule<__TestMockModule74>) as unknown as __DynamicPartialMockFactory<__TestMockModule74>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Buttons/EditButton'),
  (() =>
    ({
      default: ({ link }: { link: string }) => (
        <a data-testid='edit-link' href={link}>
          Edit
        </a>
      ),
    }) satisfies __ExactMockModule<__TestMockModule75>) as unknown as __DynamicPartialMockFactory<__TestMockModule75>,
);

vi.mock(
  import('../../../../ClientApp/src/components/HeaderIntroText'),
  (() =>
    ({
      default: ({ children }: { children: ReactNode }) => <p>{children}</p>,
    }) satisfies __ExactMockModule<__TestMockModule76>) as unknown as __DynamicPartialMockFactory<__TestMockModule76>,
);

vi.mock(
  import('../../../../ClientApp/src/components/InTextLink'),
  (() =>
    ({
      default: ({
        children,
        href,
        target,
      }: {
        children: ReactNode;
        href: string;
        target: string;
      }) => (
        <a href={href} target={target}>
          {children}
        </a>
      ),
    }) satisfies __ExactMockModule<__TestMockModule77>) as unknown as __DynamicPartialMockFactory<__TestMockModule77>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/Checkbox'),
  (() =>
    ({
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
          <input
            data-testid='checkbox'
            data-name={name}
            data-summary={String(isSummary)}
            type='checkbox'
          />
          {label}
        </label>
      ),
    }) satisfies __ExactMockModule<__TestMockModule79>) as unknown as __DynamicPartialMockFactory<__TestMockModule79>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/supportingDocuments'),
  (() =>
    ({
      default: ({
        isSummary,
        name,
        onUploadAttachment,
        attachment,
      }: {
        isSummary: boolean;
        name: string;
        onUploadAttachment: (
          token: string,
          files: File[],
        ) => Promise<unknown[]>;
        attachment: { onUploadFiles: (files: File[]) => Promise<unknown[]> };
      }) => {
        void onUploadAttachment('token', []).then(
          mocks.supportingDocumentsUploadAttachment,
        );
        void attachment
          .onUploadFiles([])
          .then(mocks.supportingDocumentsUploadFiles);

        return (
          <div
            data-testid='supporting-documents'
            data-name={name}
            data-summary={String(isSummary)}
          />
        );
      },
    }) satisfies __ExactMockModule<__TestMockModule141>) as unknown as __DynamicPartialMockFactory<__TestMockModule141>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/RadioButtonGroup'),
  (() =>
    ({
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
          {inlineHelp ? (
            <div data-testid={`help-${name}`}>{inlineHelp}</div>
          ) : null}
          {options.map((option) => (
            <div key={option.value}>
              <span>{option.label}</span>
              <div>{option.descriptor}</div>
            </div>
          ))}
        </section>
      ),
    }) satisfies __ExactMockModule<__TestMockModule52>) as unknown as __DynamicPartialMockFactory<__TestMockModule52>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/HidableField'),
  (() =>
    ({
      default: ({ children, name }: { children: ReactNode; name: string }) => (
        <div data-testid={`hidable-${name}`}>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule70>) as unknown as __DynamicPartialMockFactory<__TestMockModule70>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextInput'),
  (() =>
    ({
      default: ({
        label,
        name,
        isSummary,
      }: {
        label: string;
        name: string;
        isSummary?: boolean;
      }) => (
        <div
          data-testid='text-input'
          data-name={name}
          data-summary={String(isSummary)}
        >
          {label}
        </div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule29>) as unknown as __DynamicPartialMockFactory<__TestMockModule29>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/AddressLookup'),
  (() =>
    ({
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
    }) satisfies __ExactMockModule<__TestMockModule31>) as unknown as __DynamicPartialMockFactory<__TestMockModule31>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/AuthorisedAgent'),
  (() =>
    ({
      default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div
          data-testid='authorised-agent'
          data-name={name}
          data-summary={String(isSummary)}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule143>) as unknown as __DynamicPartialMockFactory<__TestMockModule143>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/CommonForms/ContactDetails'),
  (() =>
    ({
      default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div
          data-testid='contact-details'
          data-name={name}
          data-summary={String(isSummary)}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule71>) as unknown as __DynamicPartialMockFactory<__TestMockModule71>,
);

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

const renderWithFormik = (children: ReactNode) =>
  render(
    <Formik
      initialValues={formValues}
      initialStatus={{ hidden: {} }}
      onSubmit={() => {}}
    >
      <Form>{children}</Form>
    </Formik>,
  );

const renderSummary = (isSubmitted = false) =>
  render(
    <MemoryRouter initialEntries={['/ta/PA-300/summary']}>
      <Formik
        initialValues={formValues}
        initialStatus={{ hidden: {} }}
        onSubmit={() => {}}
      >
        <Form>
          <Routes>
            <Route
              path='/ta/:id/summary'
              element={
                <SummaryAndSubmit
                  isSubmitted={isSubmitted}
                  name='summaryAndSubmit'
                />
              }
            />
          </Routes>
        </Form>
      </Formik>
    </MemoryRouter>,
  );

const resetTaComponentsMocks = () => {
  vi.clearAllMocks();
  mocks.supportingDocumentsUploadAttachment.mockClear();
  mocks.supportingDocumentsUploadFiles.mockClear();
};

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(OrganisationAndContact, () => {
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.hasAssertions();

    resetTaComponentsMocks();

    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );

    const principalContact = screen.getByTestId(
      'radio-organisationAndContact.isPrincipalContact',
    );

    expect({
      manufacturerSummary: screen
        .getByTestId('radio-organisationAndContact.isManufacturer')
        .getAttribute('data-summary'),
      name: screen.getByTestId('text-input').getAttribute('data-name'),
      streetAddress: screen
        .getByTestId('address-lookup')
        .getAttribute('data-name'),
      maxResults: screen
        .getByTestId('address-lookup')
        .getAttribute('data-max-results'),
      authorisedAgent: screen
        .getByTestId('authorised-agent')
        .getAttribute('data-name'),
      contactNames: screen
        .getAllByTestId('contact-details')
        .map((node) => node.getAttribute('data-name')),
      heading: screen.getByRole('heading', { name: 'Contact information' })
        .textContent,
      principalContact: [
        principalContact.textContent?.includes('Use my contact details'),
        principalContact.textContent?.includes('Dr Ada Lovelace'),
        principalContact.textContent?.includes('ada@example.gov.au'),
        principalContact.textContent?.includes('A different contact person'),
      ],
      help: screen
        .getByTestId('help-organisationAndContact.isPrincipalContact')
        .textContent?.replace(/\s+/g, ' ')
        .includes('Dashboard > Settings menu > My contact details'),
    }).toStrictEqual({
      manufacturerSummary: 'false',
      name: 'organisationAndContact.name',
      streetAddress: 'organisationAndContact.streetAddress',
      maxResults: '10',
      authorisedAgent: 'organisationAndContact.authorisedAgent',
      contactNames: [
        'organisationAndContact.contact',
        'organisationAndContact.invoiceContact',
      ],
      heading: 'Contact information',
      principalContact: [true, true, true, true],
      help: true,
    });
  });

  it('renders the summary field names without a prefix when no name is supplied', () => {
    expect.hasAssertions();

    resetTaComponentsMocks();

    renderWithFormik(<OrganisationAndContact isSummary name='' />);

    const principalContact = screen.getByTestId('radio-isPrincipalContact');

    expect({
      manufacturerSummary: screen
        .getByTestId('radio-isManufacturer')
        .getAttribute('data-summary'),
      name: screen.getByTestId('text-input').getAttribute('data-name'),
      streetAddress: screen
        .getByTestId('address-lookup')
        .getAttribute('data-name'),
      authorisedAgent: screen
        .getByTestId('authorised-agent')
        .getAttribute('data-name'),
      contactNames: screen
        .getAllByTestId('contact-details')
        .map((node) => node.getAttribute('data-name')),
      heading: screen.getByRole('heading', { name: 'Contact' }).textContent,
      noInformationHeading: screen.queryByRole('heading', {
        name: 'Contact information',
      }),
      principalContact: principalContact.textContent,
    }).toStrictEqual({
      manufacturerSummary: 'true',
      name: 'name',
      streetAddress: 'streetAddress',
      authorisedAgent: 'authorisedAgent',
      contactNames: ['contact', 'invoiceContact'],
      heading: 'Contact',
      noInformationHeading: null,
      principalContact: expect.stringContaining('Ms Grace Hopper') as unknown,
    });
  });
});

// eslint-disable-next-line vitest/valid-title -- function suite titles are required by vitest/prefer-describe-function-title.
describe(SummaryAndSubmit, () => {
  it('renders the summaries when the form carries no hiding rules', () => {
    expect.hasAssertions();

    resetTaComponentsMocks();

    render(
      <MemoryRouter initialEntries={['/ta/PA-300/summary']}>
        <Formik initialValues={formValues} onSubmit={() => {}}>
          <Form>
            <Routes>
              <Route
                path='/ta/:id/summary'
                element={<SummaryAndSubmit name='summaryAndSubmit' />}
              />
            </Routes>
          </Form>
        </Formik>
      </MemoryRouter>,
    );

    expect(screen.getByText('Application type')).toBeInTheDocument();
  });

  it('renders editable summary sections with edit links and declaration fields', async () => {
    expect.hasAssertions();

    resetTaComponentsMocks();

    renderSummary();

    const checkboxes = screen.getAllByTestId('checkbox');

    expect({
      bodyClassCalls: mocks.useBodyClass.mock.calls,
      guidance: screen.getByText(/Before you submit your request/).textContent,
      organisation: screen.getByText('Organisation name').textContent,
      application: screen.getByText('Application type').textContent,
      supportingDocuments: screen
        .getByTestId('supporting-documents')
        .getAttribute('data-name'),
      editLinks: screen
        .getAllByTestId('edit-link')
        .map((link) => link.getAttribute('href')),
      checkboxes: checkboxes.map((checkbox) =>
        checkbox.getAttribute('data-name'),
      ),
      terms: within(
        screen.getByTestId('accordion-applicationTermsAndConditions'),
      ).getByText(/You must read and accept the NMI P 106/).textContent,
      pdfTarget: screen
        .getByRole('link', {
          name: 'NMI P 106 Procedures for approval and certification of patterns of measuring instruments (PDF)',
        })
        .getAttribute('target'),
      backButton: screen.queryByTestId('back-button'),
    }).toStrictEqual({
      bodyClassCalls: [['summary']],
      guidance: expect.stringMatching(
        /Before you submit your request/,
      ) as unknown,
      organisation: 'Organisation name',
      application: 'Application type',
      supportingDocuments: 'supportingDocuments.form.documents',
      editLinks: [
        '/ta/PA-300/organisation-details',
        '/ta/PA-300/application-details',
        '/ta/PA-300/supporting-documents',
      ],
      checkboxes: [
        'acceptNMIP106',
        'acceptTermsAndConditions',
        'acceptDeclaration',
      ],
      terms: expect.stringMatching(
        /You must read and accept the NMI P 106/,
      ) as unknown,
      pdfTarget: '_blank',
      backButton: null,
    });
    await expect
      .poll(() => mocks.supportingDocumentsUploadAttachment)
      .toHaveBeenCalledWith([]);
    await expect
      .poll(() => mocks.supportingDocumentsUploadFiles)
      .toHaveBeenCalledWith([]);
  });

  it('renders the submitted summary without edit controls and with a dashboard return link', () => {
    expect.hasAssertions();

    resetTaComponentsMocks();

    renderSummary(true);

    expect(
      screen.queryByText(/Before you submit your request/),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByTestId('back-button')).toHaveTextContent(
      'Back to dashboard',
    );
  });
});
