import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import type { ContactFormStep, FormStepStatusDto } from '../../../api/web-api-client';
import type { DiscardProps } from '../../../components/forms/FormikForm/types';
import type { ErrorType, WizardStepProps } from '../../../components/forms/WizardForm/types';
import type { AccountContextState } from '../../../authentication/accountContext';
import contactSubmitValidation from '../validation';
import { completeContactDetails, loadContactDetails } from '../contactWizardStepProps';

const discardChanges: DiscardProps = {
    cancelButtonTitle: 'Cancel',
    discardButtonTitle: 'Cancel',
    showCancelButton: true,
    locationOnDiscard: '/sign-out',
};

const getRedirectionLocationOnError = (errorCode: number, _errorType: ErrorType) => {
    if (errorCode === 412) {
        return '/';
    }

    return undefined;
};

const createContactProps = (
    accounts: AccountInfo[],
    instance: IPublicClientApplication,
    statuses: FormStepStatusDto[],
    accountContext: AccountContextState | null,
    _contactId: number,
)
: WizardStepProps<ContactFormStep> => ({
    initialValues: {
    },
    stepStatuses: statuses,
    loadStepValues: loadContactDetails(accounts, instance),
    location: '/',
    title: 'My contact details',
    hidingFields: {
        contact: {
            titleOther: (x: ContactFormStep) => x.contact?.title !== 'Other',
        },
    },
    validateHard: contactSubmitValidation,
    onSaveAndNext: completeContactDetails(accounts, instance, accountContext),
    bannerTitle: 'Create portal account',
    discard: discardChanges,
    getRedirectionLocationOnError,
});

export default createContactProps;
