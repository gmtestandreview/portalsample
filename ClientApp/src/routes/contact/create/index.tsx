import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
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
import ContactDetails from '../contactDetails.tsx';
import updateContactProps from './createContactProps.ts';

const updateContactWizardProps: WizardFormProps = {
  locationOnCompletion: '/success-creating-account',
  lastStepNextButtonTitle: 'Create account',
  canSaveDraft: false,
  confirmationOnSubmission: {
    modalTitle: 'Create contact confirmation',
    modalBodyText: 'Are you sure you want to create this contact?',
    yesButtonTitle: 'Yes, submit',
    noButtonTitle: 'No, cancel',
  },
};

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
    <WizardForm {...updateContactWizardProps}>
      <WizardStep
        {...updateContactProps(
          accounts,
          instance,
          statuses,
          account,
          contactId
        )}
      >
        <ContactDetails />
      </WizardStep>
    </WizardForm>
  );
};

export default CreateContact;
