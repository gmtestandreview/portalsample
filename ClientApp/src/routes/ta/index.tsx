import { useMsal } from '@azure/msal-react';
import { useNavigate, useParams } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import WizardForm from '../../components/forms/WizardForm';
import type { WizardFormProps } from '../../components/forms/WizardForm/types';
import WizardStep from '../../components/forms/WizardForm/WizardStep';
import useBodyClass from '../../components/Utilities/useBodyClass';
import useAccountContext from '../../authentication/hooks';
import {
  type FormStepStatusDto,
  RequestForPatternApprovalClient,
} from '../../api/web-api-client';
import { silentRequestFor } from '../../authentication/silentRequest';
import BlockUISpinner from '../../components/BlockUISpinner';
import AppLogger from '../../instrumentation/AppLogger';
import ApplicationAndInstrument from './applicationAndInstrument';
import applicationAndInstrumentProps from './applicationAndInstrumentProps';
import SummaryAndSubmit from './summaryAndSubmit';
import summaryAndSubmitProps from './summaryAndSubmitProps';
import SupportingDocuments from './supportingDocuments';
import supportingDocumentsProps from './supportingDocumentsProps';
import organisationAndContactProps from './organisationAndContactProps';
import OrganisationAndContact from './organisationAndContact';
import { getUploadErrorDetails, useUploadHandlers } from './useUploadState';

const bannerTitle = 'Pattern/type approval - Application';

const ApplicationForTypeApproval = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const account = useAccountContext();
  const navigate = useNavigate();
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const handleUploadError = useCallback(
    (error: unknown) => {
      const { message, status } = getUploadErrorDetails(error);
      setSubmitErrors([message]);
      AppLogger.error('Failed to load application documents', error as Error, {
        Id: id,
        Status: status,
      });
    },
    [id],
  );
  const {
    uploading,
    progress,
    setProgress,
    handleCancelFile,
    onUploadAttachments,
  } = useUploadHandlers({
    accounts,
    instance,
    id,
    fallbackUploadId: '',
    onUploadError: handleUploadError,
  });

  useBodyClass('wizard');

  const applicationForTypeApprovalProps: WizardFormProps = {
    locationOnCompletion: `/ta/type-approval-success/${id ?? ''}`,
    lastStepNextButtonTitle: 'Submit',
    nextButtonTitle: 'Save and next',
    previousButtonTitle: 'Back',
    canSaveDraft: true,
    confirmationOnSubmission: {
      modalTitle: 'Are you sure you want to submit this request?',
      modalBodyText: `Once you have submitted this request,
        you will not be able to make any further changes in the Portal.`,
      noButtonTitle: 'No, go back',
      yesButtonTitle: 'Yes, submit',
    },
  };

  const isLoading = useRef(false);
  const [statuses, setStatuses] = useState<FormStepStatusDto[]>();

  useEffect(() => {
    const loadApplicationSteps = async () => {
      if (!statuses && accounts.length > 0) {
        const client = new RequestForPatternApprovalClient();
        const tokenResult = await instance.acquireTokenSilent(
          silentRequestFor(accounts[0]),
        );
        client.setAuthToken(tokenResult.accessToken);
        try {
          const result = await client.getStepStatuses(id ?? '');
          setStatuses(result);
        } catch (error) {
          AppLogger.error('Failed to load application steps', error as Error, {
            Id: id,
          });
          void navigate('/not-found');
        }
      }
    };
    if (!isLoading.current) {
      void loadApplicationSteps();
    }
    return () => {
      isLoading.current = true;
    };
  }, [accounts, id, instance, isLoading, navigate, statuses]);

  if (!account?.details) return null;
  const accountDetails = account.details;
  return !statuses ? (
    <BlockUISpinner>
      <p>Loading...</p>
    </BlockUISpinner>
  ) : (
    <WizardForm {...applicationForTypeApprovalProps}>
      <WizardStep
        {...organisationAndContactProps(
          id ?? '',
          accounts,
          instance,
          accountDetails,
          statuses,
          bannerTitle,
        )}
      >
        <OrganisationAndContact name='' />
      </WizardStep>
      <WizardStep
        {...applicationAndInstrumentProps(
          id ?? '',
          accounts,
          instance,
          accountDetails,
          statuses,
          bannerTitle,
        )}
      >
        <ApplicationAndInstrument name='' />
      </WizardStep>
      <WizardStep
        {...supportingDocumentsProps(
          id ?? '',
          accounts,
          instance,
          accountDetails,
          statuses,
          bannerTitle,
        )}
      >
        <SupportingDocuments
          name='form.documents'
          isSummary={false}
          onUploadAttachment={onUploadAttachments}
          attachment={{
            onUploadFiles: () => Promise.resolve([]), // Not used
          }}
          progress={progress}
          setProgress={setProgress}
          uploading={uploading}
          handleCancelFile={handleCancelFile}
          externalErrors={submitErrors}
          setExternalErrors={setSubmitErrors}
        />
      </WizardStep>
      <WizardStep
        {...summaryAndSubmitProps(
          id ?? '',
          accounts,
          instance,
          accountDetails,
          statuses,
          bannerTitle,
        )}
      >
        <SummaryAndSubmit name='' />
      </WizardStep>
    </WizardForm>
  );
};

export default ApplicationForTypeApproval;
