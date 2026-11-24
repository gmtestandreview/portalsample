import { useMsal } from '@azure/msal-react';
import { Alert } from 'react-bootstrap';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReportRecipientProps } from './types';
import {
  AcceptQuoteClient,
} from '../../api/web-api-client';
import type {
  AddressDetailsDto,
  ReportRecipientStep,
} from '../../api/web-api-client';
import { useAccountState } from '../../authentication/hooks';
import ReportRecipientFormikBridge from './reportRecipientFormikBridge';
import AppLogger from '../../instrumentation/AppLogger';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';
import ReportRecipientSummary from './summary/ReportRecipientSummary';
import type { SummaryAndAcceptStep } from '../../api/web-api-client';

type ReportRecipientLoadResult =
  | { kind: 'loaded'; step: ReportRecipientStep }
  | { kind: 'inactive' };

const ReportRecipient = (props: Readonly<ReportRecipientProps>) => {
  const { isSummary, id } = props;
  const { accounts, instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [reportRecipientStep, setReportRecipientStep] = useState<
    ReportRecipientStep | undefined
  >();
  const [postalAddress, setPostalAddress] = useState<
    AddressDetailsDto | undefined
  >();
  const [streetAddress, setStreetAddress] = useState<
    AddressDetailsDto | undefined
  >();
  const account = useAccountState();
  const homeAccountId = account?.details?.homeAccountId;
  const requestGenerationRef = useRef(0);

  const getAcceptQuotePreInfo =
    useCallback(async (): Promise<ReportRecipientLoadResult> => {
      try {
        AppLogger.verbose('ReportRecipient.getAcceptQuotePreInfo', {
          homeAccountId,
        });
        const acceptQuoteClient = new AcceptQuoteClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        acceptQuoteClient.setAuthToken(tokenResult.accessToken);

        if (id === undefined) return { kind: 'inactive' };

        const reportRecipient = await acceptQuoteClient.getReportRecipient(id);
        return { kind: 'loaded', step: reportRecipient };
      } catch (error) {
        AppLogger.error('Failed to load AcceptQuotePreInfo', error as Error, {
          Id: id,
        });
        return { kind: 'inactive' };
      }
    }, [accounts, homeAccountId, id, instance]);

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
        const { step } = result;
        setReportRecipientStep(step);
        setStreetAddress(step.rfqOrganisation?.streetAddress);
        setPostalAddress(
          step.rfqOrganisation?.postalAddressSameAsStreetAddress
            ? step.rfqOrganisation.streetAddress
            : step.rfqOrganisation?.postalAddress,
        );
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
            <p>
              You may nominate an organisation for the report by filling out the
              details below.
            </p>
            <p>
              <strong>Note:</strong> The Measurement report will be addressed to
              the organisation provided below. The report will be made available
              only through the Portal and to the organisation submitting the
              request.
            </p>
          </div>
        </Alert>
      )}
      {!isSummary && (
        <ReportRecipientFormikBridge
          streetAddress={streetAddress}
          postalAddress={postalAddress}
        />
      )}
      {isSummary && (
        <ReportRecipientSummary
          values={props.summaryValues ?? ({} as SummaryAndAcceptStep)}
          hidden={props.summaryHidden ?? {}}
          reportAddressType={reportRecipientStep?.reportAddressType}
          streetAddress={streetAddress}
          postalAddress={postalAddress}
        />
      )}
    </>
  );
};

export default ReportRecipient;
