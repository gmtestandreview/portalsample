import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import RhfSingleStepWizard from '../../../components/forms/WizardForm/RhfSingleStepWizard';
import type { RhfWizardRoutedStepProps } from '../../../components/forms/WizardForm/RhfWizardRoutedStep';
import type { FormValues } from '../../../components/forms/types';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import {
  useAccountState,
  useAccountDispatch,
} from '../../../authentication/hooks';
import type { AccountContextState } from '../../../authentication/accountContext';
import ContactDetails from '../contactDetails';
import updateContactProps from './createContactProps';

const updateContactWizardProps = {
  locationOnCompletion: '/success-creating-account',
  lastStepNextButtonTitle: 'Create account',
  canSaveDraft: false,
  confirmationOnSubmission: {
    modalTitle: 'Create contact confirmation',
    modalBodyText: 'Are you sure you want to create this contact?',
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

const CreateContact = () => {
  const { accounts, instance } = useMsal();
  const { id } = useParams();
  const accountState = useAccountState();
  const accountDispatch = useAccountDispatch();
  const account: AccountContextState | null =
    accountState && accountDispatch
      ? { ...accountState, ...accountDispatch }
      : null;

  const contactId: number = id === undefined ? 0 : Number(id);
  useHtmlTitle('Update contact | NMI Services portal');
  useBodyClass('wizard');
  return (
    <RhfSingleStepWizard
      wizard={updateContactWizardProps}
      step={updateContactProps(
        accounts,
        instance,
        statuses,
        account,
        contactId,
      )}
    >
      <ContactDetails />
    </RhfSingleStepWizard>
  );
};

export default CreateContact;
