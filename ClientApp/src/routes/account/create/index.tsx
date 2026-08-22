import { useMsal } from '@azure/msal-react';
import WizardForm from '../../../components/forms/WizardForm';
import type { WizardFormProps } from '../../../components/forms/WizardForm/types';
import WizardStep from '../../../components/forms/WizardForm/WizardStep';
import AccountDetails from '../accountDetails';
import createAccountProps from './createAccountProps';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import type { AccountContextState } from '../../../authentication/accountContext';

const createAccountWizardProps: WizardFormProps = {
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
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const CreateAccount = () => {
    const { accounts, instance } = useMsal();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const account: AccountContextState | null = accountState && accountDispatch
        ? { ...accountState, ...accountDispatch }
        : null;
    useHtmlTitle('Create portal account | NMI Services portal');
    useBodyClass('wizard');
    return (
        <WizardForm {...createAccountWizardProps}>
            <WizardStep {...createAccountProps(accounts, instance, statuses, account)}>
                <AccountDetails />
            </WizardStep>
        </WizardForm>
    );
};

export default CreateAccount;
