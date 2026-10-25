import { describe, it, expect } from 'vitest';

import { render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { FormProvider, useForm } from 'react-hook-form';

import type { ComponentProps, ReactNode } from 'react';

import { Title } from '@/api/web-api-client';

import RhfContactDetails from '@/components/forms/CommonForms/RhfContactDetails';

import { RhfHiddenRulesProvider } from '@/components/forms/RhfHidableField';

import type { Hideable } from '@/components/forms/types';

interface ContactValues {
  title: string;
  titleOther: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  mobile: string;
  email: string;
}

interface FormValues {
  organisationAndContact: { contact: ContactValues };
}

const EMPTY_CONTACT: ContactValues = {
  title: '',
  titleOther: '',
  firstName: '',
  lastName: '',
  role: '',
  phone: '',
  mobile: '',
  email: '',
};

const FILLED_CONTACT: ContactValues = {
  title: 'Dr',
  titleOther: '',
  firstName: 'Alex',
  lastName: 'Smith',
  role: 'Scientist',
  phone: '0299999999',
  mobile: '0400000000',
  email: 'alex@example.test',
};

const CONTACT_NAME = 'organisationAndContact.contact';

const CUSTOM_LABELS = {
  titleLabel: 'Salutation',
  firstNameLabel: 'Given names',
  lastNameLabel: 'Family name',
  roleLabel: 'Position',
  businessPhoneLabel: 'Office number',
  mobilePhoneLabel: 'Mobile number',
  emailAddressLabel: 'Work email',
};

const hideTitleOtherUnlessOther: Hideable = {
  organisationAndContact: {
    contact: {
      titleOther: ({ organisationAndContact }: FormValues) =>
        organisationAndContact.contact.title !== 'Other',
    },
  },
};

interface HarnessProps {
  readonly contact: ContactValues | '';
  readonly children: ReactNode;
  readonly rules?: Hideable;
}

const Harness = ({ contact, children, rules = {} }: HarnessProps) => {
  const methods = useForm({
    defaultValues: { organisationAndContact: { contact } },
  });
  const values = JSON.stringify(methods.watch());
  return (
    <RhfHiddenRulesProvider rules={rules}>
      <FormProvider {...methods}>
        <form>{children}</form>
        <output data-testid='values'>{values}</output>
      </FormProvider>
    </RhfHiddenRulesProvider>
  );
};

const contactValue = (): ContactValues =>
  (JSON.parse(screen.getByTestId('values').textContent ?? '') as FormValues)
    .organisationAndContact.contact;

const renderDetails = (
  contact: ContactValues | '',
  props: Partial<ComponentProps<typeof RhfContactDetails>> = {},
  rules?: Hideable,
) =>
  render(
    <Harness contact={contact} {...(rules ? { rules } : {})}>
      <RhfContactDetails name={CONTACT_NAME} {...props} />
    </Harness>,
  );

describe('rhfContactDetails edit mode', () => {
  it('renders the default labels and the "Other" title field', () => {
    expect.assertions(2);
    renderDetails(EMPTY_CONTACT);

    for (const label of [
      'Title (optional)',
      'First name',
      'Last name',
      'Role (optional)',
      'Business phone',
      'Mobile phone',
      'Email address',
      'If "Other"',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }

    expect(screen.getByPlaceholderText('Please enter title')).toBeVisible();
  });
});

describe('rhfContactDetails edit mode', () => {
  it('renders every supplied label', () => {
    expect.assertions(2);
    renderDetails(EMPTY_CONTACT, CUSTOM_LABELS);

    for (const label of Object.values(CUSTOM_LABELS)) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }

    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
  });
});
