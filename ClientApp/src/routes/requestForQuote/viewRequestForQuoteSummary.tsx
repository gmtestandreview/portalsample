import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import type { FormStepStatusDto } from '../../api/web-api-client.ts';
import { RequestForQuoteClient } from '../../api/web-api-client.ts';
import type { AccountDetails } from '../../authentication/accountContext.tsx';
import { tokenRequest } from '../../authentication/authConfig.ts';
import { useAccountState } from '../../authentication/hooks.tsx';
import BlockUiSpinner from '../../components/BlockUISpinner/index.tsx';
import WizardForm from '../../components/forms/WizardForm/index.tsx';
import type { WizardFormProps } from '../../components/forms/WizardForm/types.ts';
import WizardStep from '../../components/forms/WizardForm/WizardStep.tsx';
import useBodyClass from '../../components/Utilities/useBodyClass.tsx';
import AppLogger from '../../instrumentation/AppLogger.ts';
import RequestForQuoteSummary from './requestForQuoteSummary.tsx';
import type { SummaryProps } from './types.ts';
import viewRequestForQuoteSummaryProps from './viewRequestForQuoteSummaryProps.ts';

const bannerTitle = 'Testing and calibration service - Request for quote';

const ViewRequestForQuoteSummary = ({
  isSubmitted: _isSubmitted,
}: SummaryProps) => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const account = useAccountState();

  useBodyClass('summary');

  const requestForQuoteWizardProps: WizardFormProps = {
    locationOnCompletion: '/dashboard',
    previousButtonTitle: 'Back to dashboard',
    canSaveDraft: false,
    showSaveAndNextButton: false,
    showGoToDashboardButton: true,
    locationAfterExit: '/dashboard',
  };

  const isLoading = useRef(false);
  const [statuses, setStatuses] = useState<FormStepStatusDto[]>();

  useEffect(() => {
    const loadApplicationSteps = async () => {
      try {
        if (accounts.length > 0) {
          const client = new RequestForQuoteClient();
          const tokenResult = await instance.acquireTokenSilent({
            ...tokenRequest,
            account: accounts[0],
          });
          client.setAuthToken(tokenResult.accessToken);
          const result = await client.getStepStatuses(id!);
          setStatuses(result);
        }
      } catch (e) {
        AppLogger.error('Failed to retrieve step statuses', e as Error, {
          Id: id,
        });
      }
    };
    if (!isLoading.current) {
      loadApplicationSteps();
    }
    return () => {
      isLoading.current = true;
    };
  }, [accounts, id, instance]);

  const accountDetails: AccountDetails = account!.details!;
  const hasStatuses = statuses !== undefined;
  return hasStatuses ? (
    <WizardForm {...requestForQuoteWizardProps}>
      <WizardStep
        {...viewRequestForQuoteSummaryProps(
          id!,
          accounts,
          instance,
          accountDetails,
          statuses,
          bannerTitle
        )}
      >
        <RequestForQuoteSummary name='' isSubmitted={true} />
      </WizardStep>
    </WizardForm>
  ) : (
    <BlockUiSpinner>
      <p>Loading...</p>
    </BlockUiSpinner>
  );
};

export default ViewRequestForQuoteSummary;
