import { useMsal } from '@azure/msal-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { AcceptQuoteClient } from '../../api/web-api-client';
import type { AcceptQuotePreInfoDto } from '../../api/web-api-client';
import type { PaymentDetailsProps } from './types';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';
import AppLogger from '../../instrumentation/AppLogger';
import PaymentDetailsFormikBridge from './paymentDetailsFormikBridge';
import PaymentDetailsSummary from './summary/PaymentDetailsSummary';
import type { SummaryAndAcceptStep } from '../../api/web-api-client';

type PaymentDetailsLoadResult =
  | { kind: 'loaded'; preInfo: AcceptQuotePreInfoDto | undefined }
  | { kind: 'inactive' };

const PaymentDetails = (props: Readonly<PaymentDetailsProps>) => {
  const { isSummary, id } = props;
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptQuotePreInfo, setAcceptQuotePreInfo] = useState<
    AcceptQuotePreInfoDto | undefined
  >();
  const requestGenerationRef = useRef(0);

  const getAcceptQuotePreInfo =
    useCallback(async (): Promise<PaymentDetailsLoadResult> => {
      try {
        AppLogger.verbose('PaymentDetails.getAcceptQuotePreInfo', { Id: id });
        const acceptQuoteClient = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        acceptQuoteClient.setAuthToken(tokenResult.accessToken);

        if (id === undefined) return { kind: 'inactive' };

        const paymentDetails = await acceptQuoteClient.getPaymentDetails(id);
        return { kind: 'loaded', preInfo: paymentDetails.acceptQuotePreInfo };
      } catch (e) {
        AppLogger.error('Failed to load Payment details', e as Error, {
          Id: id,
        });
        return { kind: 'inactive' };
      }
    }, [accounts, id, instance]);

  useEffect(() => {
    const currentGeneration = ++requestGenerationRef.current;
    let isActive = true;

    const loadDataForDisplay = async () => {
      setIsLoading(true);
      const result = await getAcceptQuotePreInfo();
      if (!isActive || requestGenerationRef.current !== currentGeneration) {
        return;
      }
      if (result.kind === 'loaded') {
        setAcceptQuotePreInfo(result.preInfo);
      }
      setIsLoading(false);
    };
    void loadDataForDisplay();

    return () => {
      isActive = false;
    };
  }, [getAcceptQuotePreInfo]);

  return (
    <>
      {isLoading && !isSummary && (
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
            <p className='mb-0'>
              <strong>Important information</strong>
            </p>
            <p>
              A payment reference number will be provided on the invoice with
              payment details.
            </p>
            {acceptQuotePreInfo?.paymentTerms !== 'Prepaid' && (
              <p>
                <strong>
                  Invoices must be paid within 30 days of NMI invoice date.
                </strong>{' '}
                Clients not meeting this condition may have this option
                withdrawn on future occasions.
              </p>
            )}
            {acceptQuotePreInfo?.paymentTerms === 'Prepaid' && (
              <p>
                <strong>Prepayment required</strong> - An invoice will be
                forwarded following the receipt of this accepted quotation.
                Payment of the invoice is required and calibration may only
                commence once payment has been received.
              </p>
            )}
          </div>
        </Alert>
      )}
      {isSummary ? (
        <PaymentDetailsSummary
          values={props.summaryValues ?? ({} as SummaryAndAcceptStep)}
          hidden={props.summaryHidden ?? {}}
        />
      ) : (
        <PaymentDetailsFormikBridge
          quotationId={acceptQuotePreInfo?.quotationIdNum}
        />
      )}
    </>
  );
};

export default PaymentDetails;
