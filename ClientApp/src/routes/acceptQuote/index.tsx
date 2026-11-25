import { useMsal } from '@azure/msal-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import RhfWizardRoutedStep from '../../components/forms/WizardForm/RhfWizardRoutedStep';
import type { RhfWizardRoutedStepProps } from '../../components/forms/WizardForm/RhfWizardRoutedStep';
import type { FormValues } from '../../components/forms/types';
import type { WizardStepElement } from '../../components/forms/WizardForm/wizardStepContracts';
import WizardStep from '../../components/forms/WizardForm/WizardStep';
import useBodyClass from '../../components/Utilities/useBodyClass';
import { useAccountState } from '../../authentication/hooks';
import {
  AcceptQuoteClient,
  FormStepStatus,
  QuoteClient,
} from '../../api/web-api-client';
import type { FormStepStatusDto } from '../../api/web-api-client';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';
import ReportRecipient from './reportRecipient';
import reportRecipientProps from './reportRecipientProps';
import DeliveryAndReturn from './deliveryAndReturn';
import deliveryAndReturnProps from './deliveryAndReturnProps';
import PaymentDetails from './paymentDetails';
import paymentDetailsProps from './paymentDetailsProps';
import SummaryAndAccept from './summaryAndAccept';
import summaryAndAcceptProps from './summaryAndAcceptProps';
import AppLogger from '../../instrumentation/AppLogger';

const bannerTitle = 'Testing and calibration service - Quotation';

const AcceptQuote = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const account = useAccountState();
  const navigate = useNavigate();
  const currentPath = useLocation().pathname;

  useBodyClass('wizard');

  const acceptQuoteWizardProps = {
    locationOnCompletion: `/submitted-success/${id ?? ''}`,
    lastStepNextButtonTitle: 'Submit and accept',
    nextButtonTitle: 'Save and next',
    previousButtonTitle: 'Back',
    canSaveDraft: true,
    confirmationOnSubmission: {
      modalTitle: 'Are you sure you want to accept this quote?',
      modalBodyText: `Once you have accepted this quote,
        you will not be able to make any further changes in the Portal.`,
      noButtonTitle: 'No, go back',
      yesButtonTitle: 'Yes, submit',
    },
  } satisfies Pick<
    RhfWizardRoutedStepProps<FormValues>,
    | 'locationOnCompletion'
    | 'lastStepNextButtonTitle'
    | 'nextButtonTitle'
    | 'previousButtonTitle'
    | 'canSaveDraft'
    | 'confirmationOnSubmission'
  >;

  const isLoadingRef = useRef(false);
  const [statuses, setStatuses] = useState<FormStepStatusDto[]>();
  const [crmQuoteRequestId, setCrmQuoteRequestId] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');

  useEffect(() => {
    const loadApplicationSteps = async () => {
      if (!statuses && accounts.length > 0) {
        AppLogger.verbose('AcceptQuote.loadApplicationSteps', { Id: id });
        const client = new AcceptQuoteClient();
        const quoteClient = new QuoteClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        quoteClient.setAuthToken(tokenResult.accessToken);
        try {
          const result = await client.getStepStatuses(id ?? '');
          const crmQuoteRequestId = result[0]?.crmQuoteRequestId;
          if (!crmQuoteRequestId) {
            throw new Error('Quote request has no step statuses');
          }
          const quoteData =
            await quoteClient.getQuoteRequestDetails(crmQuoteRequestId);
          setReferenceId(quoteData.quoteRequestIdNum ?? '');
          setStatuses(result);
          setCrmQuoteRequestId(crmQuoteRequestId);
        } catch (error) {
          AppLogger.error(
            'Failed to load quote request details',
            error as Error,
            { Id: id },
          );
          void navigate('/not-found');
        }
      }
    };
    if (!isLoadingRef.current) {
      void loadApplicationSteps();
    }
    return () => {
      isLoadingRef.current = true;
    };
  }, [accounts, id, instance, isLoadingRef, navigate, statuses]);

  if (!account?.details) return null;
  const accountDetails = account.details;
  if (!statuses) {
    return (
      <BlockUISpinner>
        <p>Loading...</p>
      </BlockUISpinner>
    );
  }

  const stepProps = [
    reportRecipientProps(
      id ?? '',
      referenceId,
      accounts,
      instance,
      accountDetails,
      statuses,
      bannerTitle,
    ),
    deliveryAndReturnProps(
      id ?? '',
      accounts,
      instance,
      accountDetails,
      statuses,
      bannerTitle,
    ),
    paymentDetailsProps(
      id ?? '',
      accounts,
      instance,
      accountDetails,
      statuses,
      bannerTitle,
    ),
    summaryAndAcceptProps(
      id ?? '',
      accounts,
      instance,
      accountDetails,
      statuses,
      bannerTitle,
    ),
  ] as const;
  const steps = [
    <WizardStep key='report-recipient' {...stepProps[0]}>
      <ReportRecipient id={id} />
    </WizardStep>,
    <WizardStep key='delivery-and-return' {...stepProps[1]}>
      <DeliveryAndReturn id={id} />
    </WizardStep>,
    <WizardStep key='payment-details' {...stepProps[2]}>
      <PaymentDetails id={id} />
    </WizardStep>,
    <WizardStep key='summary-and-accept' {...stepProps[3]}>
      <SummaryAndAccept
        id={id}
        cRMQuoteRequestId={crmQuoteRequestId}
        summaryHidden={stepProps[3].hidingFields ?? {}}
      />
    </WizardStep>,
  ] satisfies readonly WizardStepElement[];
  const firstIncompleteStepIndex = statuses.findIndex(
    ({ status }) => status !== FormStepStatus.Completed,
  );
  const matchedStepIndex = stepProps.findIndex(({ location }) =>
    currentPath.endsWith(location),
  );
  const currentStepIndex = (() => {
    if (matchedStepIndex >= 0) return matchedStepIndex;
    if (firstIncompleteStepIndex >= 0) return firstIncompleteStepIndex;
    return steps.length - 1;
  })();
  const activeStepProps = (() => {
    switch (currentStepIndex) {
      case 0:
        return stepProps[0];
      case 1:
        return stepProps[1];
      case 2:
        return stepProps[2];
      default:
        return stepProps[3];
    }
  })();

  const wizardProps = {
    ...acceptQuoteWizardProps,
    ...activeStepProps,
    allSteps: steps,
    currentStepIndex,
    url: `/accept-quote/${id ?? ''}`,
    location: activeStepProps.location,
  } as RhfWizardRoutedStepProps<FormValues>;

  return <RhfWizardRoutedStep<FormValues> {...wizardProps} />;
};

export default AcceptQuote;
