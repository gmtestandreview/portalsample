import Row from 'react-bootstrap/Row';
import { PatternFormat } from 'react-number-format';
import SummaryDisplay from '../../../components/SummaryDisplay';
import ContactSummary from '../../ta/summary/ContactSummary';
import { formatTradingBranchFromStrings } from '../../common/helperFunctions';
import { isSummaryFieldHidden } from './types';
import type { RfqSummarySectionProps } from './types';

const ROOT = 'organisationAndContact';
const ABN_FORMAT = '## ### ### ###';

const PRINCIPAL_CONTACT_OPTIONS = [
  { value: 'Yes', label: 'Use my contact details' },
  { value: 'No', label: 'A different contact person' },
];

/**
 * Read-only organisation and contact section. Form-free twin of
 * `OrganisationAndContact` in summary mode.
 */
const RfqOrganisationSummary = (props: Readonly<RfqSummarySectionProps>) => {
  const org = props.values.organisationAndContact;
  const abn = org?.abn;
  const principal = org?.isPrincipalContact;

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
              org?.businessOrTradingName,
              org?.branchOrLocationName
            )}
          </span>
          <span className='d-block text-break'>{org?.name}</span>
          <span id='orgABN' className='d-inline-block me-3 fs-5 fw-normal'>
            {'ABN: '}
            <PatternFormat
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
      <Row className='mb-4'>
        <h2 className='h3 my-3'>Contact</h2>
        {principal ? (
          <SummaryDisplay
            label='Who is the main contact person for this request?'
            id='q-isPrincipalContact'
            as='span'
            value={
              PRINCIPAL_CONTACT_OPTIONS.find((o) => o.value === principal)
                ?.label ?? 'No details added'
            }
          />
        ) : null}
        {!isSummaryFieldHidden(props, `${ROOT}.principalContactHide`) && (
          <ContactSummary name={`${ROOT}.contact`} contact={org?.contact} />
        )}
      </Row>
    </>
  );
};

export default RfqOrganisationSummary;
