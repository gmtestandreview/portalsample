import { useMsal } from '@azure/msal-react';
import Row from 'react-bootstrap/Row';
import { Alert, Col } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { AcceptQuoteClient, AccountsClient } from '../../api/web-api-client';
import type {
  AcceptQuotePreInfoDto,
  AddressDetailsDto,
  DeliveryAndReturnStep,
} from '../../api/web-api-client';
import { prefixedPropertyOf } from '../../utils';
import type { DeliveryAndReturnProps } from './types';
import RadioButtonGroup from '../../components/Inputs/RadioButtonGroup';
import HidableField from '../../components/forms/HidableField';
import ContactDetailsInput from '../../components/forms/CommonForms/ContactDetails';
import BlockUISpinner from '../../components/BlockUISpinner';
import { silentRequestFor } from '../../authentication/silentRequest';
import { useAccountState } from '../../authentication/hooks';
import MailingLabel from '../../components/Utilities/mailingLabel';
import AppLogger from '../../instrumentation/AppLogger';
import DeliveryInstructions from '../../components/Utilities/deliveryInstructions';
import { getFormattedAddress } from '../common/helperFunctions';
import DeliveryAndReturnFormikBridge from './deliveryAndReturnFormikBridge';

const getName = prefixedPropertyOf<DeliveryAndReturnStep>('deliveryAndReturn');

function getNameForUse2(
  name: keyof DeliveryAndReturnStep,
  isSummary: boolean | undefined
) {
  const fullname = isSummary ? getName(name) : name;
  return fullname;
}

const DeliveryAndReturn = (props: Readonly<DeliveryAndReturnProps>) => {
  const { isSummary, id } = props;
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryAndReturnStep, setDeliveryAndReturnStep] = useState<
    DeliveryAndReturnStep | undefined
  >();
  const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<
    AcceptQuotePreInfoDto | undefined
  >();
  const [postalAddress, setPostalAddress] = useState<
    AddressDetailsDto | undefined
  >();
  const [streetAddress, setStreetAddress] = useState<
    AddressDetailsDto | undefined
  >();
  const account = useAccountState();
  const homeAccountId = account?.details?.homeAccountId;

  function getNameForUse(name: keyof DeliveryAndReturnStep): string {
    return getNameForUse2(name, isSummary);
  }

  const renderNoDeliveryInfoMsg = () => (
    <p className='mb-0'>
      This quotation does not require the delivery or return of the
      instrument/artefact to the NMI.
      <br />
      Contact your NMI test officer for further details.
    </p>
  );

  const renderNoDeliveryInfoPanel = () => (
    <Alert
      variant='basic'
      role='status'
      aria-live='off'
      className='d-flex mb-4'
    >
      <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
        <div className='-bgCircle mb-3 me-3'>
          <i className='icon-warning text-primary' aria-hidden='true' />
        </div>
      </div>
      <div>
        <p className='mb-0 visually-hidden'>
          <strong>Important information</strong>
        </p>
        {renderNoDeliveryInfoMsg()}
      </div>
    </Alert>
  );

  useEffect(() => {
    const getAcceptQuotePreInfo = async () => {
      try {
        AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', {
          homeAccountId,
        });
        const acceptQuoteClient = new AcceptQuoteClient();
        const accountsClient = new AccountsClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0])
        );
        acceptQuoteClient.setAuthToken(tokenResult.accessToken);
        accountsClient.setAuthToken(tokenResult.accessToken);

        const deliveryAndReturn = await acceptQuoteClient.getDeliveryAndReturn(
          id!
        );
        setDeliveryAndReturnStep(deliveryAndReturn);
        setAcceptQuotePreInfo(deliveryAndReturn.acceptQuotePreInfo);

        setStreetAddress(deliveryAndReturn.rfqOrganisation?.streetAddress);

        if (deliveryAndReturn.rfqOrganisation?.postalAddressSameAsStreetAddress)
          setPostalAddress(deliveryAndReturn.rfqOrganisation?.streetAddress);
        else setPostalAddress(deliveryAndReturn.rfqOrganisation?.postalAddress);
      } catch (error) {
        AppLogger.error('Failed to load AcceptQuotePreInfo', error as Error, {
          Id: id,
        });
      }
    };

    const loadDataForDisplay = async () => {
      setIsLoading(true);
      await getAcceptQuotePreInfo();
      setIsLoading(false);
    };
    void loadDataForDisplay();
  }, [homeAccountId, accounts, id, instance]);

  return (
    <>
      {isLoading && (
        <BlockUISpinner>
          <p>Loading...</p>
        </BlockUISpinner>
      )}
      {isSummary ? null : (
        <Alert
          variant='info'
          data-testid='info-summary'
          role='status'
          aria-live='polite'
          className='d-flex mb-4'
        >
          <div className='d-flex justify-content-center justify-content-md-start mb-3 mb-md-0'>
            <div className='bgCircle mb-3 me-3'>
              <i className='icon-info' aria-hidden='true' />
            </div>
          </div>
          <div>
            <strong>Important information</strong>
            {acceptQuotePreInfo?.receiptAndDispatchNA ? (
              renderNoDeliveryInfoMsg()
            ) : (
              <>
                <p>
                  Delays in shipping instruments/artefacts to NMI may impact our
                  service time frames. Please allow extra time for shipping to
                  us.
                </p>
                <p>
                  Instruments/artefacts not clearly labelled with the Quotation
                  ID may experience additional delays for calibration.
                </p>
                <p>
                  <strong>Note:</strong> The client is responsible for all costs
                  associated with delivery to NMI and all arrangements and costs
                  associated with return.
                </p>
              </>
            )}
          </div>
        </Alert>
      )}
      {!acceptQuotePreInfo?.receiptAndDispatchNA && (
        <>
          <Row className='mb-4'>
            <h2 className={isSummary ? 'h3 my-3' : ''}>
              Instrument/artefact delivery
            </h2>
            <h3 className={isSummary ? 'h4 my-3' : ''}>
              Please deliver the instrument/artefact to NMI with the following
              label attached
            </h3>
            <MailingLabel {...acceptQuotePreInfo} />
            <DeliveryInstructions
              deliveryInstructions={
                acceptQuotePreInfo?.nmiFacilityDeliveryInstructions
              }
            />
          </Row>
          {isSummary ? (
            <>
              <Row className='mb-4'>
                <h2 className='h3 my-3'>Instrument/artefact return</h2>
                <h3 className='h4 my-3'>Return contact person</h3>
                <RadioButtonGroup
                  legend='Please select your contact person for the returned instrument/artefact when the job has completed'
                  name={getNameForUse('returnContactType')}
                  id='q-returnContactType'
                  isSummary={isSummary}
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
              <HidableField name={getNameForUse('rfqHide')}>
                <Row className='mb-4'>
                  <h4 className='h5 my-3'>Return contact person details</h4>
                  <ContactDetailsInput
                    key='contact'
                    name='requestForQuote.contact'
                    isSummary={isSummary}
                  />
                </Row>
              </HidableField>
              <HidableField name={getNameForUse('contactHide')}>
                <Row className='mb-4'>
                  <h4 className='h5 my-3'>Return contact person details</h4>
                  <ContactDetailsInput
                    key='contact'
                    name={getNameForUse('contact')}
                    isSummary={isSummary}
                  />
                </Row>
              </HidableField>
              {deliveryAndReturnStep &&
                (() => {
                  const {
                    returnAddressType,
                    rfqOrganisation,
                    returnOrganisationName,
                    returnAddress,
                  } = deliveryAndReturnStep;
                  let address: AddressDetailsDto | undefined;

                  const organisationName = returnOrganisationName;

                  switch (returnAddressType) {
                    case 'BusinessAddress':
                      address = streetAddress;
                      break;
                    case 'PostalAddress':
                      address =
                        rfqOrganisation?.postalAddressSameAsStreetAddress
                          ? streetAddress
                          : postalAddress;
                      break;
                    case 'Other':
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
                        {organisationName ? (
                          <p>{organisationName}</p>
                        ) : (
                          <p>-</p>
                        )}
                      </div>
                      {address && (
                        <>
                          <div className='form-label mb-0'>Return address</div>
                          <p>{getFormattedAddress(address)}</p>
                        </>
                      )}
                    </>
                  );
                })()}
              <Row className='mb-4'>
                <h3 className='h4 my-3'>Return method</h3>
                <RadioButtonGroup
                  legend='Choose your return method for the instrument/artefact'
                  name={getNameForUse('returnMethod')}
                  id='q-returnMethod'
                  isSummary={isSummary}
                  options={[
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
                  ]}
                />
              </Row>
            </>
          ) : (
            <DeliveryAndReturnFormikBridge
              streetAddress={streetAddress}
              postalAddress={postalAddress}
            />
          )}
        </>
      )}
      {acceptQuotePreInfo?.receiptAndDispatchNA && isSummary && (
        <Row className='mb-4'>
          <Col md={12}>{renderNoDeliveryInfoPanel()}</Col>
        </Row>
      )}
    </>
  );
};

export default DeliveryAndReturn;
