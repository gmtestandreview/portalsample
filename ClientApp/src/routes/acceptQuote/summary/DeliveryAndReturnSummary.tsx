import Row from 'react-bootstrap/Row';
import { ReturnAddressTypeValues } from '../../../api/web-api-client';
import type {
  AddressDetailsDto,
  DeliveryAndReturnStep,
} from '../../../api/web-api-client';
import { getFormattedAddress } from '../../common/helperFunctions';
import {
  RETURN_CONTACT_TYPE_OPTIONS,
  RETURN_METHOD_OPTIONS,
} from '../deliveryAndReturnOptions';
import ContactBlockSummary from './ContactBlockSummary';
import OptionSummary from './OptionSummary';
import { isSummaryFieldHidden } from './types';
import type { AcceptQuoteSummarySectionProps } from './types';

interface AddressSources {
  streetAddress: AddressDetailsDto | undefined;
  postalAddress: AddressDetailsDto | undefined;
}

interface ReturnAddressSummaryProps extends AddressSources {
  deliveryAndReturnStep: DeliveryAndReturnStep;
}

const ReturnAddressSummary = ({
  deliveryAndReturnStep,
  streetAddress,
  postalAddress,
}: Readonly<ReturnAddressSummaryProps>) => {
  const {
    returnAddressType,
    rfqOrganisation,
    returnOrganisationName,
    returnAddress,
  } = deliveryAndReturnStep;
  let address: AddressDetailsDto | undefined;

  switch (returnAddressType) {
    case ReturnAddressTypeValues.BusinessAddress:
      address = streetAddress;
      break;
    case ReturnAddressTypeValues.PostalAddress:
      address = rfqOrganisation?.postalAddressSameAsStreetAddress
        ? streetAddress
        : postalAddress;
      break;
    case ReturnAddressTypeValues.Other:
      address = returnAddress;
      break;
    default:
      return null;
  }

  return (
    <>
      <h3>Instrument/artefact return address</h3>
      <div className='mb-4'>
        <div className='form-label mb-0'>
          Return organisation name (optional)
        </div>
        {returnOrganisationName ? <p>{returnOrganisationName}</p> : <p>-</p>}
      </div>
      {address && (
        <>
          <div className='form-label mb-0'>Return address</div>
          <p>{getFormattedAddress(address)}</p>
        </>
      )}
    </>
  );
};

interface DeliveryAndReturnSummaryProps
  extends AcceptQuoteSummarySectionProps, AddressSources {
  deliveryAndReturnStep: DeliveryAndReturnStep | undefined;
}

const CONTACT_HEADING = 'Return contact person details';

/**
 * Read-only return section. Form-free twin of `DeliveryAndReturn` in summary
 * mode, below the delivery label that the page still loads itself.
 */
const DeliveryAndReturnSummary = (
  props: Readonly<DeliveryAndReturnSummaryProps>,
) => {
  const { values, deliveryAndReturnStep, streetAddress, postalAddress } = props;
  const returnSection = values.deliveryAndReturn;

  return (
    <>
      <Row className='mb-4'>
        <h2 className='h3 my-3'>Instrument/artefact return</h2>
        <h3 className='h4 my-3'>Return contact person</h3>
        <OptionSummary
          legend='Please select your contact person for the returned instrument/artefact when the job has completed'
          id='q-returnContactType'
          value={returnSection?.returnContactType}
          options={RETURN_CONTACT_TYPE_OPTIONS}
        />
      </Row>
      {!isSummaryFieldHidden(props, 'deliveryAndReturn.rfqHide') && (
        <Row className='mb-4'>
          <h4 className='h5 my-3'>{CONTACT_HEADING}</h4>
          <ContactBlockSummary
            name='requestForQuote.contact'
            contact={values.requestForQuote?.contact}
            hideTitleOther={isSummaryFieldHidden(
              props,
              'requestForQuote.contact.titleOther',
            )}
          />
        </Row>
      )}
      {!isSummaryFieldHidden(props, 'deliveryAndReturn.contactHide') && (
        <Row className='mb-4'>
          <h4 className='h5 my-3'>{CONTACT_HEADING}</h4>
          <ContactBlockSummary
            name='deliveryAndReturn.contact'
            contact={returnSection?.contact}
            hideTitleOther={isSummaryFieldHidden(
              props,
              'deliveryAndReturn.contact.titleOther',
            )}
          />
        </Row>
      )}
      {deliveryAndReturnStep && (
        <ReturnAddressSummary
          deliveryAndReturnStep={deliveryAndReturnStep}
          streetAddress={streetAddress}
          postalAddress={postalAddress}
        />
      )}
      <Row className='mb-4'>
        <h3 className='h4 my-3'>Return method</h3>
        <OptionSummary
          legend='Choose your return method for the instrument/artefact'
          id='q-returnMethod'
          value={returnSection?.returnMethod}
          options={RETURN_METHOD_OPTIONS}
        />
      </Row>
    </>
  );
};

export default DeliveryAndReturnSummary;
