import type { ContactDto } from '../../../api/web-api-client';
import { Title } from '../../../api/web-api-client';
import SummaryDisplay from '../../../components/SummaryDisplay';
import { getPhoneNumberFormat } from '../../../components/Inputs/NumberInput/phoneFormat';
import { toTitle } from '../../../utils/apiEnumMappings';

const MOBILE_FORMAT = '#### ### ###';

const titleText = (title: string | undefined) => {
  if (!title) return undefined;
  const known = toTitle(title);
  return known?.replace(/([A-Z])/g, ' $1').trim();
};

type ContactSummaryContact = Omit<Partial<ContactDto>, 'title'> & {
  title?: string | undefined;
};

export interface ContactSummaryLabels {
  firstName?: string;
  lastName?: string;
  phone?: string;
  mobile?: string;
}

interface ContactSummaryProps {
  /** Id prefix for the rows, e.g. `organisationAndContact.contact`. */
  name: string;
  contact: ContactSummaryContact | undefined;
  hideTitleOther?: boolean;
  /** Replaces the default label of a row, e.g. to mark it optional. */
  labels?: ContactSummaryLabels;
}

const TitleRows = ({
  name,
  contact,
  hideTitleOther,
}: Readonly<{
  name: string;
  contact: ContactSummaryContact | undefined;
  hideTitleOther: boolean;
}>) => {
  const title = titleText(contact?.title);

  return (
    <>
      {title ? (
        <SummaryDisplay
          label='Title (optional)'
          id={`${name}.title`}
          as='p'
          value={title}
        />
      ) : null}
      {contact?.title === '' ? (
        <SummaryDisplay
          label='Title (optional)'
          id='titleEmpty'
          as='p'
          value=''
        />
      ) : null}
      {contact?.title === Title.Other && !hideTitleOther && (
        <SummaryDisplay
          label='Title, if "Other"'
          id={`${name}.titleOther`}
          as='p'
          value={contact.titleOther ?? ''}
        />
      )}
    </>
  );
};

const NO_LABELS: ContactSummaryLabels = {};

const orEmpty = (value: string | undefined) => value ?? '';

const labelOr = (label: string | undefined, fallback: string) =>
  label ?? fallback;

/** Read-only contact block, matching `ContactDetailsInput` in summary mode. */
const ContactSummary = ({
  name,
  contact,
  hideTitleOther = false,
  labels = NO_LABELS,
}: Readonly<ContactSummaryProps>) => {
  const c: ContactSummaryContact = contact ?? {};

  return (
    <>
      <TitleRows
        name={name}
        contact={contact}
        hideTitleOther={hideTitleOther}
      />
      <SummaryDisplay
        label={labelOr(labels.firstName, 'First name')}
        id={`${name}.firstName`}
        as='p'
        value={orEmpty(c.firstName)}
      />
      <SummaryDisplay
        label={labelOr(labels.lastName, 'Last name')}
        id={`${name}.lastName`}
        as='p'
        value={orEmpty(c.lastName)}
      />
      <SummaryDisplay
        label='Role (optional)'
        id={`${name}.role`}
        as='p'
        value={orEmpty(c.role)}
      />
      <SummaryDisplay
        label={labelOr(labels.phone, 'Business phone')}
        id={`${name}.phone`}
        value={orEmpty(c.phone)}
        format={getPhoneNumberFormat(c.phone)}
      />
      <SummaryDisplay
        label={labelOr(labels.mobile, 'Mobile phone')}
        id={`${name}.mobile`}
        value={orEmpty(c.mobile)}
        format={MOBILE_FORMAT}
      />
      <SummaryDisplay
        label='Email address'
        id={`${name}.email`}
        as='p'
        value={orEmpty(c.email)}
      />
    </>
  );
};

export default ContactSummary;
