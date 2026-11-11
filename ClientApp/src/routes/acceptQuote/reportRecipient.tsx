import { useMsal } from '@azure/msal-react';
import Row from 'react-bootstrap/Row';
import { Alert } from 'react-bootstrap';
import { useCallback, useEffect, useRef, useState } from 'react';
import TextInput from '../../components/Inputs/TextInput';
import type { ReportRecipientProps } from './types';
import {
  AcceptQuoteClient,
  ReportAddressTypeValues,
} from '../../api/web-api-client';
import type {
  AddressDetailsDto,
  ReportRecipientStep,
} from '../../api/web-api-client';
import { prefixedPropertyOf } from '../../utils';
import AddressLookup from '../../components/Inputs/AddressLookup';
import { useAccountState } from '../../authentication/hooks';
import { getFormattedAddress } from '../common/helperFunctions';
import ReportRecipientFormikBridge from './reportRecipientFormikBridge';
import AppLogger from '../../instrumentation/AppLogger';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';

const getName = prefixedPropertyOf<ReportRecipientStep>('reportRecipient');

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
  const requestGeneration = useRef(0);

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
    const currentGeneration = ++requestGeneration.current;
    let isActive = true;

    const loadDataForDisplay = async () => {
      setIsLoading(true);
      const result = await getAcceptQuotePreInfo();
      if (!isActive || requestGeneration.current !== currentGeneration) {
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
        <Row className='mb-4'>
          <h2 className='h3 my-3'>Report recipient organisation</h2>
          <TextInput
            label='Organisation name for report'
            name={getName('organisationName')}
            isSummary={isSummary}
          />
          {reportRecipientStep?.reportAddressType ===
            ReportAddressTypeValues.Other && (
            <AddressLookup
              name={getName('businessStreetAddress')}
              label='Organisation address for report'
              maxResults={10}
              key='businessStreetAddress'
              placeholder='Start typing the business street address'
              isSummary={isSummary}
            />
          )}
          {reportRecipientStep?.reportAddressType ===
            ReportAddressTypeValues.BusinessAddress && (
            <>
              <div className='form-label mb-0'>
                Organisation address for report
              </div>
              <p>{getFormattedAddress(streetAddress)}</p>
            </>
          )}
          {reportRecipientStep?.reportAddressType ===
            ReportAddressTypeValues.PostalAddress && (
            <>
              <div className='form-label mb-0'>
                Organisation address for report
              </div>
              <p>{getFormattedAddress(postalAddress)}</p>
            </>
          )}
        </Row>
      )}
    </>
  );
};

export default ReportRecipient;
