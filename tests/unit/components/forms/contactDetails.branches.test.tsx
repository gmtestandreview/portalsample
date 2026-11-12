import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { Title } from '@/api/web-api-client';
import ContactDetails from '@/components/forms/CommonForms/ContactDetails';
import * as apiEnumMappings from '@/utils/apiEnumMappings';

const customLabels = {
  titleLabel: 'Salutation',
  firstNameLabel: 'Given names',
  lastNameLabel: 'Family name',
  roleLabel: 'Position',
  businessPhoneLabel: 'Office number',
  mobilePhoneLabel: 'Mobile number',
  emailAddressLabel: 'Work email',
};

interface ContactFormValues {
  contact: {
    title: string;
    titleOther: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    mobile: string;
    email: string;
  };
  organisationAndContact: { contact: { title: string } };
}

type ContactSubmit = (values: ContactFormValues) => void | Promise<void>;

describe('contactDetails branch coverage', () => {
  it('renders all supplied labels in edit mode', () => {
    expect.hasAssertions();

    render(
      <Formik
        initialValues={{
          contact: {
            title: '',
            titleOther: '',
            firstName: '',
            lastName: '',
            role: '',
            phone: '',
            mobile: '',
            email: '',
          },
          organisationAndContact: { contact: { title: '' } },
        }}
        initialStatus={{ hidden: {} }}
        onSubmit={vi.fn<ContactSubmit>()}
      >
        <ContactDetails name='contact' {...customLabels} />
      </Formik>,
    );

    for (const label of Object.values(customLabels)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const options = screen
      .getAllByRole('option')
      .map((option) => option.getAttribute('value'));

    expect(options.slice(1)).toStrictEqual(Object.values(Title));
  });

  it('omits the empty-title fallback when a summary has a title', () => {
    expect.hasAssertions();

    render(
      <Formik
        initialValues={{
          contact: {
            title: 'Dr',
            titleOther: '',
            firstName: 'Alex',
            lastName: 'Smith',
            role: 'Scientist',
            phone: '0299999999',
            mobile: '0400000000',
            email: 'alex@example.test',
          },
          organisationAndContact: { contact: { title: 'Dr' } },
        }}
        initialStatus={{ hidden: {} }}
        onSubmit={vi.fn<ContactSubmit>()}
      >
        <ContactDetails name='contact' isSummary {...customLabels} />
      </Formik>,
    );

    expect(screen.getByText('Dr')).toBeInTheDocument();
  });

  it('skips title options that do not map to a display title', () => {
    expect.hasAssertions();

    const toTitle = vi
      .spyOn(apiEnumMappings, 'toTitle')
      .mockImplementation((value) =>
        value === Title.Dr ? undefined : (value as Title),
      );

    try {
      render(
        <Formik
          initialValues={{
            contact: {
              title: '',
              titleOther: '',
              firstName: '',
              lastName: '',
              role: '',
              phone: '',
              mobile: '',
              email: '',
            },
            organisationAndContact: { contact: { title: '' } },
          }}
          initialStatus={{ hidden: {} }}
          onSubmit={vi.fn<ContactSubmit>()}
        >
          <ContactDetails name='contact' />
        </Formik>,
      );

      expect(
        screen.getAllByRole('option').map((option) => option.textContent),
      ).not.toContain('Dr');
    } finally {
      toTitle.mockRestore();
    }
  });
});
