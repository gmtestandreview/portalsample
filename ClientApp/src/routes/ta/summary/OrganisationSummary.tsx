import Row from 'react-bootstrap/Row';
import type { AddressDetailsDto } from '../../../api/web-api-client';
import SummaryDisplay from '../../../components/SummaryDisplay';
import { getFormattedAddress } from '../../common/helperFunctions';
import ContactSummary from './ContactSummary';
import { isSummaryFieldHidden } from './types';
import type { TaSummarySectionProps } from './types';

const ROOT = 'organisationAndContact';
const ABN_FORMAT = '## ### ### ###';

interface Option {
  value: string;
  label: string;
}

const MANUFACTURER_OPTIONS: Option[] = [
  { value: 'Yes', label: 'Manufacturer' },
  { value: 'No', label: 'Authorised Agent' },
];

const PRINCIPAL_CONTACT_OPTIONS: Option[] = [
  { value: 'Yes', label: 'Use my contact details' },
  { value: 'No', label: 'A different contact person' },
];

const INVOICE_CONTACT_OPTIONS: Option[] = [
  { value: 'Yes', label: 'Same as main/primary contact' },
  { value: 'No', label: 'A different contact person' },
];

/** Shows the chosen option's label, or nothing when no answer was given. */
const OptionSummary = ({
  legend,
  id,
  value,
  options,
  containerClassName,
}: Readonly<{
  legend: string;
  id: string;
  value: string | undefined;
  options: Option[];
  containerClassName?: string;
}>) =>
  value ? (
    <SummaryDisplay
      label={legend}
      id={id}
      as='span'
      {...(containerClassName ? { containerClassName } : {})}
      value={
        options.find((option) => option.value === value)?.label ??
        'No details added'
      }
    />
  ) : null;

const AddressSummary = ({
  label,
  id,
  address,
}: Readonly<{
  label: string;
  id: string;
  address: AddressDetailsDto | undefined;
}>) => (
  <SummaryDisplay
    label={label}
    id={id}
    as='span'
    value={address ? getFormattedAddress(address) : '-'}
  />
);

/**
 * Read-only organisation and contact section. Form-free twin of
 * `OrganisationAndContact` in summary mode.
 */
const OrganisationSummary = (props: Readonly<TaSummarySectionProps>) => {
  const org = props.values.organisationAndContact;
  const hidden = (field: string) =>
    isSummaryFieldHidden(props, `${ROOT}.${field}`);

  return (
    <>
      <Row>
        <OptionSummary
          legend='Organisation type'
          id='q-isManufacturer'
          containerClassName='mb-1'
          value={org?.isManufacturer}
          options={MANUFACTURER_OPTIONS}
        />
      </Row>
      <Row>
        {!hidden('isCurrentOrganisationHide') && (
          <>
            <SummaryDisplay
              label='Organisation name'
              id={`${ROOT}.name`}
              as='p'
              value={org?.name ?? ''}
            />
            <AddressSummary
              label='Business address'
              id={`${ROOT}.streetAddress`}
              address={org?.streetAddress}
            />
          </>
        )}
        {!hidden('isManufacturerHide') && (
          <Row className='mb-4'>
            <SummaryDisplay
              label='Manufacturer name'
              id={`${ROOT}.authorisedAgent.manufacturerName`}
              as='p'
              value={org?.authorisedAgent?.manufacturerName ?? ''}
            />
            <SummaryDisplay
              label='Company Identifier'
              id={`${ROOT}.authorisedAgent.abn`}
              value={org?.authorisedAgent?.abn ?? ''}
              format={ABN_FORMAT}
            />
            <h3 className='mb-2'>Business street address</h3>
            <AddressSummary
              label='Address'
              id={`${ROOT}.authorisedAgent.streetAddress`}
              address={org?.authorisedAgent?.streetAddress}
            />
          </Row>
        )}
      </Row>
      <Row className='mb-4'>
        <h2 className='h3 my-3'>Contact</h2>
        <OptionSummary
          legend='Who is the main contact person for this application?'
          id='q-isPrincipalContact'
          value={org?.isPrincipalContact}
          options={PRINCIPAL_CONTACT_OPTIONS}
        />
        {!hidden('principalContactHide') && (
          <ContactSummary name={`${ROOT}.contact`} contact={org?.contact} />
        )}
      </Row>
      <Row>
        <OptionSummary
          legend='Invoice/Account contact person'
          id='q-isPrincipalInvoiceContact'
          value={org?.isPrincipalInvoiceContact}
          options={INVOICE_CONTACT_OPTIONS}
        />
        {!hidden('principalInvoiceContactHide') && (
          <ContactSummary
            name={`${ROOT}.invoiceContact`}
            contact={org?.invoiceContact}
          />
        )}
      </Row>
    </>
  );
};

export default OrganisationSummary;
