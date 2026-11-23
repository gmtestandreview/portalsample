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

/** Read-only contact block, matching `ContactDetailsInput` in summary mode. */
const ContactSummary = ({
  name,
  contact,
  hideTitleOther = false,
  labels,
}: Readonly<ContactSummaryProps>) => {
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
      <SummaryDisplay
        label={labels?.firstName ?? 'First name'}
        id={`${name}.firstName`}
        as='p'
        value={contact?.firstName ?? ''}
      />
      <SummaryDisplay
        label={labels?.lastName ?? 'Last name'}
        id={`${name}.lastName`}
        as='p'
        value={contact?.lastName ?? ''}
      />
      <SummaryDisplay
        label='Role (optional)'
        id={`${name}.role`}
        as='p'
        value={contact?.role ?? ''}
      />
      <SummaryDisplay
        label={labels?.phone ?? 'Business phone'}
        id={`${name}.phone`}
        value={contact?.phone ?? ''}
        format={getPhoneNumberFormat(contact?.phone)}
      />
      <SummaryDisplay
        label={labels?.mobile ?? 'Mobile phone'}
        id={`${name}.mobile`}
        value={contact?.mobile ?? ''}
        format={MOBILE_FORMAT}
      />
      <SummaryDisplay
        label='Email address'
        id={`${name}.email`}
        as='p'
        value={contact?.email ?? ''}
      />
    </>
  );
};

export default ContactSummary;
