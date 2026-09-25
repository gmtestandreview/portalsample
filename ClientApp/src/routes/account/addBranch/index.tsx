import { useMsal } from '@azure/msal-react';
import WizardForm from '../../../components/forms/WizardForm';
import type { WizardFormProps } from '../../../components/forms/WizardForm/types';
import WizardStep from '../../../components/forms/WizardForm/WizardStep';
import addBranchProps from './addBranchProps';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import type { AccountContextState } from '../../../authentication/accountContext';
import { useModalDispatch } from '../../../components/modals/ModalContext';
import OrganisationDetails from '../organisationDetails';

const addBranchWizardProps: WizardFormProps = {
    locationOnCompletion: '/',
    lastStepNextButtonTitle: 'Save and close',
    // nextButtonTitle: 'Save and next',
    canSaveDraft: false,
    confirmationOnSubmission: {
        modalTitle: 'Add branch or location confirmation',
        modalBodyText: 'Are you sure you want to add this branch/location?',
        yesButtonTitle: 'Yes, submit',
        noButtonTitle: 'No, cancel',
    },
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const AddBranch = () => {
    const { accounts, instance } = useMsal();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const modalDispatch = useModalDispatch();
    const account: AccountContextState | null = accountState && accountDispatch
        ? { ...accountState, ...accountDispatch }
        : null;
    const onShowBranchSelector = () => modalDispatch?.setShowBranchSelector(true);
    useHtmlTitle('Add branch or location | NMI Services portal');
    useBodyClass('wizard');
    return (
        <WizardForm {...addBranchWizardProps}>
            <WizardStep {...addBranchProps(accounts, instance, statuses, account, onShowBranchSelector)}>
                <OrganisationDetails />
            </WizardStep>
        </WizardForm>
    );
};

export default AddBranch;
