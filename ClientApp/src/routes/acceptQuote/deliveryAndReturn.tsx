import { useMsal } from '@azure/msal-react';
import { Alert, Col, Row } from 'react-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type {
  AddressDetailsDto,
  DeliveryAndReturnStep,
} from '../../api/web-api-client';
import type { DeliveryAndReturnProps } from './types';
import BlockUISpinner from '../../components/BlockUISpinner';
import { createAuthenticatedClient } from '../../authentication/authenticatedClient';
import { useAccountState } from '../../authentication/hooks';
import { RhfFormApiContext } from '../../components/forms/RhfForm/rhfFormApiContext';
import MailingLabel from '../../components/Utilities/mailingLabel';
import AppLogger from '../../instrumentation/AppLogger';
import DeliveryInstructions from '../../components/Utilities/deliveryInstructions';
import DeliveryAndReturnFormFields from './deliveryAndReturnFormFields';
import DeliveryAndReturnSummary from './summary/DeliveryAndReturnSummary';

interface LoadedDeliveryAndReturn {
  step: DeliveryAndReturnStep;
  streetAddress: AddressDetailsDto | undefined;
  postalAddress: AddressDetailsDto | undefined;
}

const toLoaded = (step: DeliveryAndReturnStep): LoadedDeliveryAndReturn => {
  const organisation = step.rfqOrganisation;
  return {
    step,
    streetAddress: organisation?.streetAddress,
    postalAddress: organisation?.postalAddressSameAsStreetAddress
      ? organisation.streetAddress
      : organisation?.postalAddress,
  };
};

const DeliveryAndReturn = (props: Readonly<DeliveryAndReturnProps>) => {
  const { isSummary, id } = props;
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loaded, setLoaded] = useState<LoadedDeliveryAndReturn | undefined>();
  const setSubmitBlocked = useContext(RhfFormApiContext)?.setSubmitBlocked;
  const account = useAccountState();
  const homeAccountId = account?.details?.homeAccountId;

  const acceptQuotePreInfo = loaded?.step.acceptQuotePreInfo;
  const { streetAddress, postalAddress } = loaded ?? {};

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

  // The fields are hidden when the step's own load failed; the shell must not
  // save or complete the step with values the user cannot see.
  const blocksSubmit = loadFailed && !isSummary;
  useEffect(() => {
    setSubmitBlocked?.(blocksSubmit);
    return () => {
      setSubmitBlocked?.(false);
    };
  }, [blocksSubmit, setSubmitBlocked]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      if (id === undefined) {
        setIsLoading(false);
        setLoadFailed(false);
        setLoaded(undefined);
        return;
      }

      setIsLoading(true);
      setLoadFailed(false);
      setLoaded(undefined);
      try {
        AppLogger.verbose('DeliveryAndReturn.getAcceptQuotePreInfo.', {
          homeAccountId,
        });
        const client = await createAuthenticatedClient(
          AcceptQuoteClient,
          accounts,
          instance,
        );
        const step = await client.getDeliveryAndReturn(id, signal);
        if (signal.aborted) return;

        setLoaded(toLoaded(step));
      } catch (error) {
        // A superseded request (id changed or unmounted) is not a failure.
        if (signal.aborted) return;

        setLoadFailed(true);
        AppLogger.error('Failed to load AcceptQuotePreInfo', error as Error, {
          Id: id,
        });
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      controller.abort();
    };
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
      {loadFailed && (
        <Alert variant='danger' role='alert' className='mb-4'>
          We could not load your delivery and return details. Please refresh the
          page or try again later.
        </Alert>
      )}
      {!loadFailed && !acceptQuotePreInfo?.receiptAndDispatchNA && (
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
              values={props.summaryValues ?? {}}
              hidden={props.summaryHidden ?? {}}
              deliveryAndReturnStep={loaded?.step}
              streetAddress={streetAddress}
              postalAddress={postalAddress}
            />
          ) : (
            <DeliveryAndReturnFormFields
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
