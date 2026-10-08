import type { ContactDto } from '../../../api/web-api-client';
import { Title } from '../../../api/web-api-client';
import SummaryDisplay from '../../../components/SummaryDisplay';
import { getPhoneNumberFormat } from '../../../components/Inputs/NumberInput/phoneFormat';

const MOBILE_FORMAT = '#### ### ###';

const titleText = (title: string | undefined) => {
  if (!title) return undefined;
  const known = Title[title as keyof typeof Title] as Title | undefined;
  return known?.replace(/([A-Z])/g, ' $1').trim();
};

interface ContactSummaryProps {
  /** Id prefix for the rows, e.g. `organisationAndContact.contact`. */
  name: string;
  contact: Partial<ContactDto> | undefined;
}

/** Read-only contact block, matching `ContactDetailsInput` in summary mode. */
const ContactSummary = ({ name, contact }: Readonly<ContactSummaryProps>) => {
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
      {(contact?.title as string | undefined) === '' ? (
        <SummaryDisplay
          label='Title (optional)'
          id='titleEmpty'
          as='p'
          value=''
        />
      ) : null}
      {contact?.title === Title.Other && (
        <SummaryDisplay
          label='Title, if "Other"'
          id={`${name}.titleOther`}
          as='p'
          value={contact?.titleOther ?? ''}
        />
      )}
      <SummaryDisplay
        label='First name'
        id={`${name}.firstName`}
        as='p'
        value={contact?.firstName ?? ''}
      />
      <SummaryDisplay
        label='Last name'
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
        label='Business phone'
        id={`${name}.phone`}
        value={contact?.phone ?? ''}
        format={getPhoneNumberFormat(contact?.phone)}
      />
      <SummaryDisplay
        label='Mobile phone'
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
