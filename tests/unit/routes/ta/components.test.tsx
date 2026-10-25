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

vi.mock(
  import('../../../../ClientApp/src/components/Utilities/useBodyClass'),
  () =>
    ({
      default: mocks.useBodyClass,
    }) satisfies __ExactMockModule<__TestMockModule59>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Accordion'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule74>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Buttons/EditButton'),
  () =>
    ({
      default: ({ link }: { link: string }) => (
        <a data-testid='edit-link' href={link}>
          Edit
        </a>
      ),
    }) satisfies __ExactMockModule<__TestMockModule75>,
);

vi.mock(
  import('../../../../ClientApp/src/components/HeaderIntroText'),
  () =>
    ({
      default: ({ children }: { children: ReactNode }) => <p>{children}</p>,
    }) satisfies __ExactMockModule<__TestMockModule76>,
);

vi.mock(
  import('../../../../ClientApp/src/components/InTextLink'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule77>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/Checkbox'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule79>,
);

vi.mock(
  import('../../../../ClientApp/src/routes/ta/supportingDocuments'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule141>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/RadioButtonGroup'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule52>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/HidableField'),
  () =>
    ({
      default: ({ children, name }: { children: ReactNode; name: string }) => (
        <div data-testid={`hidable-${name}`}>{children}</div>
      ),
    }) satisfies __ExactMockModule<__TestMockModule70>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/TextInput'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule29>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/AddressLookup'),
  () =>
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
    }) satisfies __ExactMockModule<__TestMockModule31>,
);

vi.mock(
  import('../../../../ClientApp/src/components/Inputs/AuthorisedAgent'),
  () =>
    ({
      default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div
          data-testid='authorised-agent'
          data-name={name}
          data-summary={String(isSummary)}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule143>,
);

vi.mock(
  import('../../../../ClientApp/src/components/forms/CommonForms/ContactDetails'),
  () =>
    ({
      default: ({ name, isSummary }: { name: string; isSummary?: boolean }) => (
        <div
          data-testid='contact-details'
          data-name={name}
          data-summary={String(isSummary)}
        />
      ),
    }) satisfies __ExactMockModule<__TestMockModule71>,
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

describe(OrganisationAndContact, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.assertions(1);
    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );
    expect(
      screen.getByTestId('radio-organisationAndContact.isManufacturer'),
    ).toHaveAttribute('data-summary', 'false');
  });
});

describe(OrganisationAndContact, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.assertions(1);
    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );
    expect(screen.getByTestId('text-input')).toHaveAttribute(
      'data-name',
      'organisationAndContact.name',
    );
  });
});

describe(OrganisationAndContact, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.assertions(1);
    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-name',
      'organisationAndContact.streetAddress',
    );
  });
});

describe(OrganisationAndContact, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.assertions(1);
    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );
    expect(screen.getByTestId('address-lookup')).toHaveAttribute(
      'data-max-results',
      '10',
    );
  });
});

describe(OrganisationAndContact, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders the editable organisation and contact fields with prefixed field names', () => {
    expect.assertions(1);
    renderWithFormik(
      <OrganisationAndContact
        isSummary={false}
        name='organisationAndContact'
      />,
    );
    expect(screen.getByTestId('authorised-agent')).toHaveAttribute(
      'data-name',
      'organisationAndContact.authorisedAgent',
    );
  });
});
