import Row from 'react-bootstrap/Row';
import {
  ReportAddressTypeValues,
  type AddressDetailsDto,
  type ReportRecipientStep,
} from '../../api/web-api-client';
import RhfAddressLookup from '../../components/Inputs/RhfAddressLookup';
import RhfRadioButtonGroup from '../../components/Inputs/RhfRadioButtonGroup';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import RhfHidableField from '../../components/forms/RhfHidableField';
import type { BridgedValues } from '../../components/forms/useFormikRhfBridge';
import { getFormattedAddress } from '../common/helperFunctions';

export type ReportRecipientFormValues = ReportRecipientStep & BridgedValues;

interface ReportRecipientFormFieldsProps {
  streetAddress?: AddressDetailsDto | undefined;
  postalAddress?: AddressDetailsDto | undefined;
}

const ReportRecipientFormFields = ({
  streetAddress,
  postalAddress,
}: Readonly<ReportRecipientFormFieldsProps>) => (
  <Row className='mb-4'>
    <h2>Report recipient organisation</h2>
    <RhfTextInput
      label='Organisation name for report'
      name='organisationName'
    />
    <RhfRadioButtonGroup<ReportAddressTypeValues>
      legend='Organisation address for report'
      name='reportAddressType'
      id='q-reportAddressType'
      containerClassName='mb-3'
      options={[
        {
          label: 'Business street address',
          value: ReportAddressTypeValues.BusinessAddress,
          descriptor: getFormattedAddress(streetAddress),
          id: 'returnAddressType-BusinessAddress',
        },
        {
          label: 'Business postal address',
          value: ReportAddressTypeValues.PostalAddress,
          descriptor: getFormattedAddress(postalAddress),
          id: 'returnAddressType-PostalAddress',
        },
        {
          label: 'Other',
          value: ReportAddressTypeValues.Other,
          id: 'returnAddressType-Other',
        },
      ]}
    />
    <RhfHidableField name='businessStreetAddress'>
      <div className='px-5'>
        <RhfAddressLookup
          name='businessStreetAddress'
          label='Business street address'
          maxResults={10}
          placeholder='Start typing the business street address'
        />
      </div>
    </RhfHidableField>
  </Row>
);

export default ReportRecipientFormFields;
