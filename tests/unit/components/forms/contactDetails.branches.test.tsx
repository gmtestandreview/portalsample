import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { Title } from '@/api/web-api-client';
import ContactDetails from '@/components/forms/CommonForms/ContactDetails';
import { renderTitleOptionTexts } from '../../helpers/titleOptions';

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

const EMPTY_CONTACT: ContactFormValues['contact'] = {
  title: '',
  titleOther: '',
  firstName: '',
  lastName: '',
  role: '',
  phone: '',
  mobile: '',
  email: '',
};

const renderInFormik = (
  ui: ReactElement,
  contact: Partial<ContactFormValues['contact']> = {},
) => {
  const values = { ...EMPTY_CONTACT, ...contact };

  return render(
    <Formik
      initialValues={{
        contact: values,
        organisationAndContact: { contact: { title: values.title } },
      }}
      initialStatus={{ hidden: {} }}
      onSubmit={vi.fn<ContactSubmit>()}
    >
      {ui}
    </Formik>,
  );
};

describe('contactDetails branch coverage', () => {
  it('renders all supplied labels in edit mode', () => {
    expect.hasAssertions();

    renderInFormik(<ContactDetails name='contact' {...customLabels} />);

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

    renderInFormik(
      <ContactDetails name='contact' isSummary {...customLabels} />,
      {
        title: 'Dr',
        firstName: 'Alex',
        lastName: 'Smith',
        role: 'Scientist',
        phone: '0299999999',
        mobile: '0400000000',
        email: 'alex@example.test',
      },
    );

    expect(screen.getByText('Dr')).toBeInTheDocument();
  });

  it('skips title options that do not map to a display title', () => {
    expect.hasAssertions();

    const options = renderTitleOptionTexts(Title.Dr, () =>
      renderInFormik(<ContactDetails name='contact' />),
    );

    expect(options).not.toContain('Dr');
    expect(options).toContain('Mr');
  });
});
