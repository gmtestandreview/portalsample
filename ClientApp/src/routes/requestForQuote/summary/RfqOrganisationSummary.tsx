import Row from 'react-bootstrap/Row';
import { PatternFormat } from 'react-number-format';
import SummaryDisplay from '../../../components/SummaryDisplay';
import ContactSummary from '../../ta/summary/ContactSummary';
import { formatTradingBranchFromStrings } from '../../common/helperFunctions';
import { YesNo } from '../../../api/web-api-client';
import { isSummaryFieldHidden } from './types';
import type { RfqCurrentContact, RfqSummarySectionProps } from './types';

interface RfqOrganisationSummaryProps extends RfqSummarySectionProps {
  /** Omit to leave the account holder out, as the editable summary always did. */
  currentContact?: RfqCurrentContact;
}

const ROOT = 'organisationAndContact';
const ABN_FORMAT = '## ### ### ###';

const PRINCIPAL_CONTACT_OPTIONS = [
  { value: 'Yes', label: 'Use my contact details' },
  { value: 'No', label: 'A different contact person' },
];

type RfqOrganisation = NonNullable<
  RfqSummarySectionProps['values']['organisationAndContact']
>;

interface OrganisationHeaderProps {
  organisation: RfqOrganisation | undefined;
  branchOrLocationName: string | undefined;
}

const OrganisationHeader = ({
  organisation,
  branchOrLocationName,
}: Readonly<OrganisationHeaderProps>) => {
  const abn = organisation?.abn;

  return (
    <>
      <Row className='mb-4'>
        <h2 id='orgDetails' className='h3 my-3'>
          Organisation
        </h2>
      </Row>
      <Row className='mb-4'>
        <h2 className='h3 mb-0' aria-describedby='orgABN'>
          <span className='d-block text-break'>
            {formatTradingBranchFromStrings(
              organisation?.businessOrTradingName,
              branchOrLocationName
            )}
          </span>
          <span className='d-block text-break'>{organisation?.name}</span>
          <span id='orgABN' className='d-inline-block me-3 fs-5 fw-normal'>
            {'ABN: '}
            <PatternFormat
              // exactOptionalPropertyTypes rejects undefined; PatternFormat accepts null.
              value={abn ?? null}
              displayType='text'
              format={ABN_FORMAT}
              aria-hidden='true'
              role='presentation'
              valueIsNumericString={false}
            />
          </span>
          <span className='visually-hidden'>{abn?.split('').join(' ')}</span>
        </h2>
      </Row>
    </>
  );
};

interface PrincipalContactSummaryProps {
  principal: string | undefined;
  currentContact: RfqCurrentContact | undefined;
}

const PrincipalContactSummary = ({
  principal,
  currentContact,
}: Readonly<PrincipalContactSummaryProps>) => (
  <>
    {principal ? (
      <SummaryDisplay
        label='Who is the main contact person for this request?'
        id='q-isPrincipalContact'
        as='span'
        value={
          PRINCIPAL_CONTACT_OPTIONS.find((o) => o.value === principal)?.label ??
          'No details added'
        }
      />
    ) : null}
    {principal === YesNo.Yes && currentContact ? (
      <p id='q-currentContact' className='mb-4 text-break'>
        {currentContact.name}
        <br />
        {currentContact.email}
      </p>
    ) : null}
  </>
);

interface ContactDetailsSummaryProps {
  props: Readonly<RfqOrganisationSummaryProps>;
  contact: RfqOrganisation['contact'];
  hideTitleOther: boolean;
}

const ContactDetailsSummary = ({
  props,
  contact,
  hideTitleOther,
}: Readonly<ContactDetailsSummaryProps>) =>
  !isSummaryFieldHidden(props, `${ROOT}.principalContactHide`) ? (
    <ContactSummary
      name={`${ROOT}.contact`}
      contact={contact}
      hideTitleOther={hideTitleOther}
    />
  ) : null;

/**
 * Read-only organisation and contact section. Form-free twin of
 * `OrganisationAndContact` in summary mode.
 */
const RfqOrganisationSummary = (
  props: Readonly<RfqOrganisationSummaryProps>
) => {
  const { currentContact } = props;
  const org = props.values.organisationAndContact;
  const principal = org?.isPrincipalContact;
  const branchOrLocationName = isSummaryFieldHidden(
    props,
    `${ROOT}.branchOrLocationName`
  )
    ? undefined
    : org?.branchOrLocationName;
  const hideTitleOther = isSummaryFieldHidden(
    props,
    `${ROOT}.contact.titleOther`
  );

  return (
    <>
      <OrganisationHeader
        organisation={org}
        branchOrLocationName={branchOrLocationName}
      />
      <Row className='mb-4'>
        <h2 className='h3 my-3'>Contact</h2>
        <PrincipalContactSummary
          principal={principal}
          currentContact={currentContact}
        />
        <ContactDetailsSummary
          props={props}
          contact={org?.contact}
          hideTitleOther={hideTitleOther}
        />
      </Row>
    </>
  );
};

export default RfqOrganisationSummary;
