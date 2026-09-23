import { useMsal } from '@azure/msal-react';
import { Navigate, useParams } from 'react-router';
import type { FormStepStatusDto } from '../../../api/web-api-client.ts';
import { FormStepStatus } from '../../../api/web-api-client.ts';
import type { AccountContextState } from '../../../authentication/accountContext.tsx';
import {
  useAccountDispatch,
  useAccountState,
} from '../../../authentication/hooks.tsx';
import WizardForm from '../../../components/forms/WizardForm/index.tsx';
import type { WizardFormProps } from '../../../components/forms/WizardForm/types.ts';
import WizardStep from '../../../components/forms/WizardForm/WizardStep.tsx';
import useBodyClass from '../../../components/Utilities/useBodyClass.tsx';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle.tsx';
import { getValidPositiveIntegerId } from '../../common/routeParams.ts';
import OrganisationDetails from '../organisationDetails.tsx';
import updateAccountProps from './updateAccountProps.ts';

const updateAccountWizardProps: WizardFormProps = {
  locationOnCompletion: '/',
  lastStepNextButtonTitle: 'Save and close',
  // nextButtonTitle: 'Save and next',
  canSaveDraft: false,
  confirmationOnSubmission: {
    modalTitle: 'Update organisation confirmation',
    modalBodyText: 'Are you sure you want to update this organisation?',
    yesButtonTitle: 'Yes, submit',
    noButtonTitle: 'No, cancel',
  },
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const UpdateAccount = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const account: AccountContextState | null =
    accountState && accountDispatch
      ? { ...accountState, ...accountDispatch }
      : null;

  const accountId = getValidPositiveIntegerId(id);
  useHtmlTitle('Manage organisation | NMI Services portal');
  useBodyClass('wizard');

  if (accountId === null) {
    return <Navigate to='/not-found' replace={true} />;
  }

  return (
    <WizardForm {...updateAccountWizardProps}>
      <WizardStep
        {...updateAccountProps(
          accounts,
          instance,
          statuses,
          account,
          accountId
        )}
      >
        <OrganisationDetails />
      </WizardStep>
    </WizardForm>
  );
};

export default UpdateAccount;
