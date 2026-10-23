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
  rules?: Hideable
) =>
  render(
    <Harness contact={contact} {...(rules ? { rules } : {})}>
      <RhfContactDetails name={CONTACT_NAME} {...props} />
    </Harness>
  );

describe('rhfContactDetails edit mode', () => {
  it('renders the default labels and the "Other" title field', () => {
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

  it('renders every supplied label', () => {
    renderDetails(EMPTY_CONTACT, CUSTOM_LABELS);

    for (const label of Object.values(CUSTOM_LABELS)) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }

    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
  });

  it('offers a blank option then every title with spaced display text', () => {
    renderDetails(EMPTY_CONTACT);

    const options = screen
      .getAllByRole('option')
      .map((option) => [option.textContent, option.getAttribute('value')]);

    expect(options[0]).toEqual(['Please select', '']);
    expect(options).toContainEqual([
      'Associate Professor',
      'AssociateProfessor',
    ]);
    expect(options).toContainEqual(['Other', 'Other']);
    expect(options).toHaveLength(Object.keys(Title).length + 1);
  });

  it('writes typed and chosen values into the form', async () => {
    const user = userEvent.setup();
    renderDetails(EMPTY_CONTACT);

    await user.selectOptions(screen.getByLabelText('Title (optional)'), 'Dr');
    await user.type(screen.getByLabelText('If "Other"'), 'Chief');
    await user.type(screen.getByLabelText('First name'), 'Alex');
    await user.type(screen.getByLabelText('Last name'), 'Smith');
    await user.type(screen.getByLabelText('Role (optional)'), 'Scientist');
    await user.type(screen.getByLabelText('Business phone'), '0299999999');
    await user.type(screen.getByLabelText('Mobile phone'), '0400000000');
    await user.type(screen.getByLabelText('Email address'), 'a@example.test');

    expect(contactValue()).toEqual({
      title: 'Dr',
      titleOther: 'Chief',
      firstName: 'Alex',
      lastName: 'Smith',
      role: 'Scientist',
      phone: '02 9999 9999',
      mobile: '0400 000 000',
      email: 'a@example.test',
    });
  });

  it('shows the "Other" title field only while the hide rule allows it', async () => {
    const user = userEvent.setup();
    renderDetails(EMPTY_CONTACT, {}, hideTitleOtherUnlessOther);

    expect(screen.queryByLabelText('If "Other"')).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Title (optional)'),
      'Other'
    );

    expect(screen.getByLabelText('If "Other"')).toBeInTheDocument();
  });
});

describe('rhfContactDetails summary mode', () => {
  it('shows a placeholder when no contact has been added', () => {
    renderDetails('', { isSummary: true });

    expect(screen.getByText('No details added')).toBeInTheDocument();
    expect(screen.queryByText('First name')).not.toBeInTheDocument();
  });

  it('renders each label with its value and no inputs', () => {
    renderDetails(FILLED_CONTACT, { isSummary: true });

    for (const label of [
      'Title (optional)',
      'First name',
      'Last name',
      'Role (optional)',
      'Business phone',
      'Mobile phone',
      'Email address',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const value of ['Dr', 'Alex', 'Smith', 'Scientist']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }

    expect(screen.getByText('alex@example.test')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders the supplied labels and the "Other" title label', () => {
    renderDetails(
      { ...FILLED_CONTACT, title: 'Other', titleOther: 'Chief' },
      { isSummary: true, ...CUSTOM_LABELS }
    );

    for (const label of Object.values(CUSTOM_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByText('Title, if "Other"')).toBeInTheDocument();
    expect(screen.getByText('Chief')).toBeInTheDocument();
  });

  it('falls back to a title row when the title is empty', () => {
    renderDetails({ ...FILLED_CONTACT, title: '' }, { isSummary: true });

    // An empty title hides the select row, so the fallback is the only
    // "Title (optional)" row; its empty-value marker joins the empty
    // "Title, if Other" one.
    expect(screen.getAllByText('Title (optional)')).toHaveLength(1);
    expect(screen.getAllByText('No details added')).toHaveLength(2);
  });

  it('keys the title fallback off the supplied name', () => {
    const Other = () => {
      const methods = useForm({
        defaultValues: { applicant: { ...FILLED_CONTACT, title: '' } },
      });
      return (
        <FormProvider {...methods}>
          <RhfContactDetails name='applicant' isSummary />
        </FormProvider>
      );
    };
    render(<Other />);

    // An empty title hides the select row, so the fallback is the only
    // "Title (optional)" row; its empty-value marker joins the empty
    // "Title, if Other" one.
    expect(screen.getAllByText('Title (optional)')).toHaveLength(1);
    expect(screen.getAllByText('No details added')).toHaveLength(2);
  });

  it('omits the title fallback row when a title is set', () => {
    renderDetails(FILLED_CONTACT, { isSummary: true });

    expect(screen.getAllByText('Title (optional)')).toHaveLength(1);
    // Only the empty "Title, if Other" row shows the marker.
    expect(screen.getAllByText('No details added')).toHaveLength(1);
  });
});
