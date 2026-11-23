import type { ContactDto } from '../../../api/web-api-client';
import ContactSummary from '../../ta/summary/ContactSummary';
import type { ContactSummaryLabels } from '../../ta/summary/ContactSummary';

interface ContactBlockSummaryProps {
  /** Id prefix for the rows, e.g. `paymentDetails.contact`. */
  name: string;
  contact: ContactDto | undefined;
  hideTitleOther: boolean;
  labels?: ContactSummaryLabels;
}

/**
 * Read-only contact block of an accept-quote step. Form-free twin of
 * `ContactDetailsInput` in summary mode, which printed the empty title row
 * only for the request-for-quote contact and never for these contacts.
 */
const ContactBlockSummary = ({
  name,
  contact,
  hideTitleOther,
  labels,
}: Readonly<ContactBlockSummaryProps>) => {
  // The loaded step turns a contact that was never added into '', and an
  // unset title into '', which the API types cannot express.
  const loadedContact: unknown = contact;
  if (loadedContact === '') {
    return <span>No details added</span>;
  }
  const loadedTitle: unknown = contact?.title;

  return (
    <ContactSummary
      name={name}
      contact={loadedTitle === '' ? { ...contact, title: undefined } : contact}
      hideTitleOther={hideTitleOther}
      {...(labels === undefined ? {} : { labels })}
    />
  );
};

export default ContactBlockSummary;
