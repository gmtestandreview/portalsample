import Row from 'react-bootstrap/Row';
import type {
  AddressDetailsDto,
  DeliveryAndReturnStep,
} from '../../api/web-api-client';
import RhfAddressLookup from '../../components/Inputs/RhfAddressLookup';
import RhfNumberInput from '../../components/Inputs/RhfNumberInput';
import RhfRadioButtonGroup from '../../components/Inputs/RhfRadioButtonGroup';
import RhfTextAreaInput from '../../components/Inputs/RhfTextAreaInput';
import RhfTextInput from '../../components/Inputs/RhfTextInput';
import RhfContactDetails from '../../components/forms/CommonForms/RhfContactDetails';
import RhfHidableField from '../../components/forms/RhfHidableField';
import type { BridgedValues } from '../../components/forms/useFormikRhfBridge';
import { getFormattedAddress } from '../common/helperFunctions';

export type DeliveryAndReturnFormValues = DeliveryAndReturnStep & BridgedValues;

const MAX_NOTES_CHARACTERS = 300;
const NOTES_ROWS = 3;
// 13 rather than 10 to account for the thousands separator and decimal point.
const CUSTOMS_VALUE_MAX_LENGTH = 13;
const CUSTOMS_VALUE_DECIMAL_SCALE = 2;

const SHIPMENT_MODE_OPTIONS = [
  { label: 'Road', value: 'Road', id: 'shipmentMode-Road' },
  { label: 'Air', value: 'Air', id: 'shipmentMode-Air' },
];

const SHIPMENT_PRIORITY_OPTIONS = [
  { label: 'Standard', value: 'Standard' },
  { label: 'Same day', value: 'SameDay' },
  { label: 'Next day', value: 'NextDay' },
  { label: 'Off peak', value: 'OffPeak' },
  { label: 'Economy', value: 'Economy' },
  { label: 'Express', value: 'Express' },
  { label: 'Overnight', value: 'Overnight' },
  {
    label: 'Overnight first class priority',
    value: 'OvernightFirstClassPriority',
  },
  { label: 'Priority', value: 'Priority' },
].map((option) => ({ ...option, id: `shipmentPriority-${option.value}` }));

const RETURN_METHOD_OPTIONS = [
  {
    label: 'Client to arrange when completed',
    value: 'ClientToArrange',
    id: 'returnMethod-ClientToArrange',
  },
  {
    label: 'Client will collect/pickup when completed',
    value: 'ClientWillCollect',
    id: 'returnMethod-ClientWillCollect',
  },
  {
    label: 'Client will provide carrier details below',
    value: 'ClientWillProvide',
    id: 'returnMethod-ClientWillProvide',
  },
];

const ReturnContactFields = () => (
  <>
    <Row className='mb-4'>
      <h2>Instrument/artefact return</h2>
      <h3>Return contact person</h3>
      <RhfRadioButtonGroup<string>
        legend='Please select your contact person for the returned instrument/artefact when the job has completed'
        name='returnContactType'
        id='q-returnContactType'
        options={[
          {
            label: 'The main contact person for this request',
            value: 'SamePerson',
            id: 'returnContactType-SamePerson',
          },
          {
            label: 'A different return contact person',
            value: 'DifferentPerson',
            id: 'returnContactType-DifferentPerson',
          },
        ]}
      />
    </Row>
    <RhfHidableField name='contactHide'>
      <Row className='mb-4'>
        <h4>Return contact person details</h4>
        <RhfContactDetails key='contact' name='contact' />
      </Row>
    </RhfHidableField>
  </>
);

interface ReturnAddressFieldsProps {
  streetAddress?: AddressDetailsDto | undefined;
  postalAddress?: AddressDetailsDto | undefined;
}

const ReturnAddressFields = ({
  streetAddress,
  postalAddress,
}: Readonly<ReturnAddressFieldsProps>) => (
  <Row className='mb-2'>
    <h3>Return organisation and address label</h3>
    <RhfTextInput
      label='Return organisation name (optional)'
      name='returnOrganisationName'
      inlineHelp={
        <span>
          Please confirm return organisation name and address for the return
          label for the instrument/artefact
        </span>
      }
    />
    <RhfRadioButtonGroup<string>
      legend='Instrument/artefact return address'
      name='returnAddressType'
      id='q-returnAddressType'
      inlineHelp={
        <span>
          Please select your return address for the instrument/artefact.
          <br />
          To update your stored organisation details go to
          <br />
          Dashboard &gt;
          {'  Settings menu '}
          <i className='icon-settings me-1' />
          &gt;
          {' Manage organisation'}
        </span>
      }
      containerClassName='mb-3'
      options={[
        {
          label: 'Business street address',
          value: 'BusinessAddress',
          descriptor: getFormattedAddress(streetAddress),
          id: 'returnAddressType-BusinessAddress',
        },
        {
          label: 'Business postal address',
          value: 'PostalAddress',
          descriptor: getFormattedAddress(postalAddress),
          id: 'returnAddressType-PostalAddress',
        },
        { label: 'Other', value: 'Other', id: 'returnAddressType-Other' },
      ]}
    />
    <RhfHidableField name='returnAddress'>
      <div className='px-5'>
        <RhfAddressLookup
          name='returnAddress'
          label='Return address'
          maxResults={10}
          key='returnAddress'
          placeholder='Start typing and then select your address from the drop-down list'
        />
      </div>
    </RhfHidableField>
  </Row>
);

const CharacterLimitHelp = () => (
  <span className='d-block pt-1'>Enter a maximum of 300 characters.</span>
);

const CarrierFields = () => (
  <RhfHidableField name='carrierHide'>
    <RhfTextAreaInput
      label='Packaging notes (optional)'
      name='packagingNotes'
      inlineHelp={
        <>
          Please specify packaging requirements if different to that as received
          at this Laboratory, extra charges may apply.
          <CharacterLimitHelp />
        </>
      }
      rows={NOTES_ROWS}
      maxCharacters={MAX_NOTES_CHARACTERS}
    />
    <h3 className='h4 my-3'>Carrier</h3>
    <RhfTextInput label='Carrier name' name='carrierName' />
    <RhfTextInput
      label='Carrier account number or Pre-paid shipment reference'
      name='carrierAccountNumber'
    />
    <RhfTextInput
      label='Carrier contact person (optional)'
      name='carrierContactPerson'
    />
    <RhfNumberInput
      label='Carrier contact phone (optional)'
      name='carrierContactPhone'
      format='checkPhoneFormat'
    />
    <RhfRadioButtonGroup<string>
      legend='Shipment mode'
      name='shipmentMode'
      id='q-shipmentMode'
      options={SHIPMENT_MODE_OPTIONS}
    />
    <RhfRadioButtonGroup<string>
      legend='Shipment priority'
      name='shipmentPriority'
      id='q-shipmentPriority'
      options={SHIPMENT_PRIORITY_OPTIONS}
    />
    <RhfTextAreaInput
      label='Insurance notes (optional)'
      name='insuranceNotes'
      inlineHelp={
        <>
          If the instrument/artefact is insured, are there any instructions that
          NMI must convey to your carrier?
          <CharacterLimitHelp />
        </>
      }
      rows={NOTES_ROWS}
      maxCharacters={MAX_NOTES_CHARACTERS}
    />
    <RhfNumberInput
      label='For overseas client, Value for Australian Customs purposes (optional)'
      name='customsValue'
      containerClassName='col-md-12 col-lg-10'
      prepend='AUD$'
      placeholder='0.00'
      allowNegative={false}
      thousandSeparator
      fixedDecimalScale
      decimalScale={CUSTOMS_VALUE_DECIMAL_SCALE}
      valueIsNumericString
      maxLength={CUSTOMS_VALUE_MAX_LENGTH}
    />
    <RhfTextAreaInput
      label='Special instructions (optional)'
      name='specialInstructions'
      inlineHelp={<CharacterLimitHelp />}
      rows={NOTES_ROWS}
      maxCharacters={MAX_NOTES_CHARACTERS}
    />
  </RhfHidableField>
);

const ReturnMethodFields = () => (
  <Row className='mb-4'>
    <h3>Return method</h3>
    <RhfRadioButtonGroup<string>
      legend='Choose your return method for the instrument/artefact'
      name='returnMethod'
      id='q-returnMethod'
      options={RETURN_METHOD_OPTIONS}
    />
    <CarrierFields />
  </Row>
);

const DeliveryAndReturnFormFields = (
  props: Readonly<ReturnAddressFieldsProps>
) => (
  <>
    <ReturnContactFields />
    <ReturnAddressFields {...props} />
    <ReturnMethodFields />
  </>
);

export default DeliveryAndReturnFormFields;
