import { useMsal } from '@azure/msal-react';
import { useParams } from 'react-router';
import WizardForm from '../../../components/forms/WizardForm';
import type { WizardFormProps } from '../../../components/forms/WizardForm/types';
import WizardStep from '../../../components/forms/WizardForm/WizardStep';
import useHtmlTitle from '../../../components/Utilities/useHtmlTitle';
import useBodyClass from '../../../components/Utilities/useBodyClass';
import { FormStepStatus } from '../../../api/web-api-client';
import type { FormStepStatusDto } from '../../../api/web-api-client';
import { useAccountState, useAccountDispatch } from '../../../authentication/hooks';
import type { AccountContextState } from '../../../authentication/accountContext';
import ContactDetails from '../contactDetails';
import updateContactProps from './updateContactProps';

const updateContactWizardProps: WizardFormProps = {
    locationOnCompletion: '/',
    lastStepNextButtonTitle: 'Save and close',
    canSaveDraft: false,
    confirmationOnSubmission: {
        modalTitle: 'Update contact confirmation',
        modalBodyText: 'Are you sure you want to update this contact?',
        yesButtonTitle: 'Yes, submit',
        noButtonTitle: 'No, cancel',
    },
};

const statuses: FormStepStatusDto[] = [{ status: FormStepStatus.NotStarted }];

const UpdateContact = () => {
    const { accounts, instance } = useMsal();
    const { id } = useParams();
    const accountState = useAccountState();
    const accountDispatch = useAccountDispatch();
    const account: AccountContextState | null = accountState && accountDispatch
        ? { ...accountState, ...accountDispatch }
        : null;

    const contactId: number = Number(id ?? 0);
    useHtmlTitle('Update contact | NMI Services portal');
    useBodyClass('wizard');
    return (
        <WizardForm {...updateContactWizardProps}>
            <WizardStep {...updateContactProps(accounts, instance, statuses, account, contactId)}>
                <ContactDetails />
            </WizardStep>
        </WizardForm>
    );
};

export default UpdateContact;
