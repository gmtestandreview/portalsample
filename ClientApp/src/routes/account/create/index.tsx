import { useMsal } from '@azure/msal-react';
import RhfSingleStepWizard from '../../../components/forms/WizardForm/RhfSingleStepWizard';
import type { RhfWizardRoutedStepProps } from '../../../components/forms/WizardForm/RhfWizardRoutedStep';
import type { FormValues } from '../../../components/forms/types';
import AccountDetails from '../accountDetails';
import createAccountProps from './createAccountProps';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import {
  useAccountState,
  useAccountDispatch,
} from '../../../authentication/hooks';
import type { AccountContextState } from '../../../authentication/accountContext';

const createAccountWizardProps = {
  locationOnCompletion: '/success-creating-account',
  lastStepNextButtonTitle: 'Create account',
  // nextButtonTitle: 'Save and next',
  canSaveDraft: false,
  confirmationOnSubmission: {
    modalTitle: 'Create account confirmation',
    modalBodyText: 'Are you sure you want to create this account?',
    yesButtonTitle: 'Yes, submit',
    noButtonTitle: 'No, cancel',
  },
} satisfies Pick<
  RhfWizardRoutedStepProps<FormValues>,
  | 'locationOnCompletion'
  | 'lastStepNextButtonTitle'
  | 'canSaveDraft'
  | 'confirmationOnSubmission'
>;

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const CreateAccount = () => {
  const { accounts, instance } = useMsal();
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const account: AccountContextState | null =
    accountState && accountDispatch
      ? { ...accountState, ...accountDispatch }
      : null;
  useHtmlTitle('Create portal account | NMI Services portal');
  useBodyClass('wizard');
  return (
    <RhfSingleStepWizard
      wizard={createAccountWizardProps}
      step={createAccountProps(accounts, instance, statuses, account)}
    >
      <AccountDetails />
    </RhfSingleStepWizard>
  );
};

export default CreateAccount;
