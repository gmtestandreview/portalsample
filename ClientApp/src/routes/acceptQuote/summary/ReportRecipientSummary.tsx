import Row from 'react-bootstrap/Row';
import { ReportAddressTypeValues } from '../../../api/web-api-client';
import type { AddressDetailsDto } from '../../../api/web-api-client';
import SummaryDisplay from '../../../components/SummaryDisplay';
import { getFormattedAddress } from '../../common/helperFunctions';
import type { AcceptQuoteSummarySectionProps } from './types';

interface ReportRecipientSummaryProps extends AcceptQuoteSummarySectionProps {
  reportAddressType: ReportAddressTypeValues | undefined;
  streetAddress: AddressDetailsDto | undefined;
  postalAddress: AddressDetailsDto | undefined;
}

interface AddressRowProps {
  address: AddressDetailsDto | undefined;
}

const ADDRESS_LABEL = 'Organisation address for report';

const AddressRow = ({ address }: Readonly<AddressRowProps>) => (
  <>
    <div className='form-label mb-0'>{ADDRESS_LABEL}</div>
    <p>{getFormattedAddress(address)}</p>
  </>
);

/**
 * Read-only report recipient section. Form-free twin of `ReportRecipient` in
 * summary mode.
 */
const ReportRecipientSummary = ({
  values,
  reportAddressType,
  streetAddress,
  postalAddress,
}: Readonly<ReportRecipientSummaryProps>) => {
  const { organisationName, businessStreetAddress } =
    values.reportRecipient ?? {};

  return (
    <Row className='mb-4'>
      <h2 className='h3 my-3'>Report recipient organisation</h2>
      <SummaryDisplay
        label='Organisation name for report'
        id='reportRecipient.organisationName'
        as='p'
        value={organisationName}
      />
      {reportAddressType === ReportAddressTypeValues.Other && (
        <SummaryDisplay
          label={ADDRESS_LABEL}
          id='reportRecipient.businessStreetAddress'
          as='span'
          value={
            businessStreetAddress
              ? getFormattedAddress(businessStreetAddress)
              : '-'
          }
        />
      )}
      {reportAddressType === ReportAddressTypeValues.BusinessAddress && (
        <AddressRow address={streetAddress} />
      )}
      {reportAddressType === ReportAddressTypeValues.PostalAddress && (
        <AddressRow address={postalAddress} />
      )}
    </Row>
  );
};

export default ReportRecipientSummary;
