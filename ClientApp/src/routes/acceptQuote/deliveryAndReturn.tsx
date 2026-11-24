import { useMsal } from '@azure/msal-react';
import { Alert, Col, Row } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import {
  AcceptQuoteClient,
  AccountsClient,
} from '../../api/web-api-client';
import type {
  AcceptQuotePreInfoDto,
  AddressDetailsDto,
  DeliveryAndReturnStep,
} from '../../api/web-api-client';
import type { DeliveryAndReturnProps } from './types';
import BlockUISpinner from '../../components/BlockUISpinner';
import { silentRequestFor } from '../../authentication/silentRequest';
import { useAccountState } from '../../authentication/hooks';
import MailingLabel from '../../components/Utilities/mailingLabel';
import AppLogger from '../../instrumentation/AppLogger';
import DeliveryInstructions from '../../components/Utilities/deliveryInstructions';
import DeliveryAndReturnFormikBridge from './deliveryAndReturnFormikBridge';
import DeliveryAndReturnSummary from './summary/DeliveryAndReturnSummary';
import type { SummaryAndAcceptStep } from '../../api/web-api-client';

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
          silentRequestFor(accounts[0]),
        );
        acceptQuoteClient.setAuthToken(tokenResult.accessToken);
        accountsClient.setAuthToken(tokenResult.accessToken);

        if (id === undefined) return;

        const deliveryAndReturn =
          await acceptQuoteClient.getDeliveryAndReturn(id);
        setDeliveryAndReturnStep(deliveryAndReturn);
        setAcceptQuotePreInfo(deliveryAndReturn.acceptQuotePreInfo);

        setStreetAddress(deliveryAndReturn.rfqOrganisation?.streetAddress);

        if (deliveryAndReturn.rfqOrganisation?.postalAddressSameAsStreetAddress)
          setPostalAddress(deliveryAndReturn.rfqOrganisation.streetAddress);
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
            <DeliveryAndReturnSummary
              values={props.summaryValues ?? ({} as SummaryAndAcceptStep)}
              hidden={props.summaryHidden ?? {}}
              deliveryAndReturnStep={deliveryAndReturnStep}
              streetAddress={streetAddress}
              postalAddress={postalAddress}
            />
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
